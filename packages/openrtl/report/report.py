#!/usr/bin/env python3
"""
OpenRTL — report engine (report/report.py)

Parses tool outputs (yosys, nextpnr, icetime, verilator, pytest, symbiyosys)
and renders every deliverable the workflow needs into Markdown reports plus
dependency-free SVG infographics.

Usage:
  python3 report.py <section> [--project DIR] [--top MODULE] [--out DIR]

Sections:
  synth      synthesis report: netlist, resource, inference, reports,
             warnings, constraints, optimization, quality assessment
  pnr        place & route report: routing, bitstream, congestion, timing
  timing     timing closure report: fmax, slack, WNS/TNS
  power      power consumption report: toggle-based estimate per resource
  coverage   statement/toggle coverage report
  formal     formal verification report
  sim        simulation / regression report
  quality    quality assessment (aggregates the above)
  all        everything above + handoff summary into one directory
  handoff    package all reports + netlist + bitstream into a zip

Every section writes:
  docs/<phase>/reports/<section>.md   publishable markdown
  docs/<phase>/reports/<chart>.svg    dependency-free infographics

Inputs are read from:  docs/, constraints/, rtl/, tb/, formal/, build/
and are tolerant to missing artifacts (a section degrades gracefully to
"pending" instead of crashing).

Requires: Python 3.8+  (no third-party packages)
"""

from __future__ import annotations

import argparse
import datetime as _dt
import html
import json
import os
import re
import sys
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from svg import PALETTE, bar_chart, donut_chart, gauge_chart, histogram, hbar_chart, line_chart

# ---------------------------------------------------------------------------
# constants / helpers
# ---------------------------------------------------------------------------
PROJECT_FILE = "openrtl-project.json"
DECISION_FILE = "docs/00-project/decisions/DECISION-070-fpga-arch.md"

# device fabric budgets (used / available) for the utilization table
# (approx. figures; per-cell-type budgets from vendor datasheets)
DEVICE_BUDGET = {
    "ice40": {
        "ice40up5k": {"lut": 5280, "ff": 5280, "bram": 30, "pll": 1, "io": 48},
        "ice40hx8k": {"lut": 7680, "ff": 7680, "bram": 32, "pll": 1, "io": 174},
        "ice40lp8k": {"lut": 7680, "ff": 7680, "bram": 32, "pll": 1, "io": 206},
        "ice40hx1k": {"lut": 1280, "ff": 1280, "bram": 16, "pll": 0, "io": 82},
        "ice40lp1k": {"lut": 1280, "ff": 1280, "bram": 16, "pll": 0, "io": 76},
    },
    "ecp5": {
        "lfe5u-25f": {"lut": 24288, "ff": 24288, "bram": 100, "dsp": 28, "pll": 4, "io": 197},
        "lfe5u-45f": {"lut": 44016, "ff": 44016, "bram": 200, "dsp": 56, "pll": 4, "io": 365},
        "lfe5u-85f": {"lut": 83036, "ff": 83036, "bram": 208, "dsp": 156, "pll": 4, "io": 366},
        "lfe5u-12f": {"lut": 12138, "ff": 12138, "bram": 50, "dsp": 28, "pll": 4, "io": 109},
    },
    "nexus": {
        "lfcp5-85f": {"lut": 84000, "ff": 84000, "bram": 120, "dsp": 72, "pll": 3, "io": 349},
    },
}

# map budget resource -> cell-type prefixes to count from the netlist
BUDGET_CELLS = {
    "lut": ("SB_LUT4", "LUT4"),
    "ff": ("SB_DFF", "FD"),
    "bram": ("SB_RAM40_4K", "RAMS", "RAMB", "RAMB36", "RAM"),
    "dsp": ("SB_DSP", "DSP", "MULT"),
    "pll": ("SB_PLL40_CORE", "EHXPLLL", "PLL"),
    "io": ("SB_IO", "IOB"),
}


def resolve_device(root: Path) -> str:
    """Read the device (e.g. ``ice40up5k-sg48``) from openrtl-project.json."""
    try:
        j = json.loads(read(root / PROJECT_FILE))
        return str(j.get("device", ""))
    except (json.JSONDecodeError, ValueError):
        return ""


def device_utilization(cells: Dict[str, int], budget: Dict[str, int]) -> List[Tuple[str, int, int, float]]:
    """Used / available / utilization for each budget resource in `budget`."""
    out: List[Tuple[str, int, int, float]] = []
    for res, cap in budget.items():
        keys = BUDGET_CELLS.get(res, (res,))
        used = sum(v for k, v in cells.items() if k.startswith(keys))
        out.append((res.upper(), used, cap, 100.0 * used / cap))
    return out


def today() -> str:
    return _dt.date.today().isoformat()


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def find_project(start: Path) -> Path:
    """Walk up from `start` to the directory holding PROJECT_FILE."""
    cur = start.resolve()
    while True:
        if (cur / PROJECT_FILE).exists():
            return cur
        if cur.parent == cur:
            return start.resolve()
        cur = cur.parent


def resolve_top(root: Path, cli_top: str) -> str:
    if cli_top:
        return cli_top
    # 1) project json
    meta = read(root / PROJECT_FILE)
    try:
        j = json.loads(meta)
        if j.get("top"):
            return j["top"]
    except (json.JSONDecodeError, ValueError):
        pass
    # 2) DECISION-070
    if (root / DECISION_FILE).exists():
        m = re.search(r"[\"`]([a-zA-Z0-9_]+)[\"`]\s*(?:module|top|entity)", read(root / DECISION_FILE))
        if m:
            return m.group(1)
    # 3) Makefile --top-module / TOPLEVEL
    mk = read(root / "Makefile")
    m = re.search(r"--top-module\s+([a-zA-Z0-9_]+)", mk)
    if not m:
        m = re.search(r"\bTOPLEVEL\s*:?=\s*([a-zA-Z0-9_]+)", mk)
    if m:
        return m.group(1)
    # 4) first module declared in rtl/
    for f in sorted((root / "rtl").glob("*.sv")) + sorted((root / "rtl").glob("*.v")):
        m = re.search(r"\bmodule\s+([a-zA-Z0-9_]+)", read(f))
        if m:
            return m.group(1)
    return "top"


def resolve_arch(root: Path, cli_arch: str) -> str:
    if cli_arch:
        return cli_arch
    dec = read(root / DECISION_FILE)
    m = re.search(r"(ice40|ecp5|nexus|generic)\b", dec)
    if m:
        return m.group(1)
    return "ice40"


def find_build(root: Path, flow: str, name: str) -> Path:
    for cand in (root / "build" / flow / name, root / "build" / name, root / name):
        if cand.exists():
            return cand
    return root / "build" / flow / name


# ---------------------------------------------------------------------------
# parsers
# ---------------------------------------------------------------------------
def parse_yosys_stat(log: str) -> Dict[str, int]:
    """Extract cell counts per type from a yosys stat dump.

    Handles both yosys stat line orientations:
      - local count (`tee -o` stat):  ``45   SB_LUT4``  (count, then name)
      - script stat:                  ``SB_LUT4    45`` (name, then count)
    The ``Number of cells:`` block (script stat) supersedes local counts.
    """
    SKIP = {"wires", "bits", "public", "ports", "cells", "memories", "processes"}
    counts: Dict[str, int] = {}

    def add(name: str, n: int) -> None:
        if name not in SKIP:
            counts[name] = counts.get(name, 0) + n

    # format A: ``<count>   <cellname>``
    for m in re.finditer(r"^\s*(\d+)\s+([A-Za-z_][A-Za-z0-9_$\.]*)\s*$", log, re.M):
        add(m.group(2), int(m.group(1)))
    # format B: ``Number of cells:`` block with ``<cellname>   <count>``
    for block in re.findall(r"Number of cells:\s*(?:\d+)?\s*(.*?)(?=\n\s*\n|\Z)", log, re.S):
        block_counts: Dict[str, int] = {}
        for m in re.finditer(r"^\s*([A-Za-z_][A-Za-z0-9_$\.]*)\s+(\d+)\s*$", block, re.M):
            if m.group(1) not in SKIP:
                block_counts[m.group(1)] = block_counts.get(m.group(1), 0) + int(m.group(2))
        if block_counts:
            counts = block_counts
    return counts


def parse_resource_summary(log: str) -> Dict[str, Optional[str]]:
    """Number of wires, wire bits, ports, port bits, memories, processes.

    Handles the `tee -o` form (`61 wires`, `143 wire bits`) and the script
    stat form (`Number of wires: 61`).
    """
    out: Dict[str, Optional[str]] = {}
    pairs = {
        "wires": r"(\d+)\s+wires(?:$|\s)",
        "wire bits": r"(\d+)\s+wire bits",
        "public wires": r"(\d+)\s+public wires",
        "public wire bits": r"(\d+)\s+public wire bits",
        "ports": r"(\d+)\s+ports(?:$|\s)",
        "port bits": r"(\d+)\s+port bits",
        "memories": r"(\d+)\s+memories(?:$|\s)",
        "memory bits": r"(\d+)\s+memory bits",
        "processes": r"(\d+)\s+processes(?:$|\s)",
    }
    for key, pat in pairs.items():
        m = re.search(pat, log, re.M)
        if m:
            out[key] = m.group(1)
        else:
            m = re.search(rf"Number of {re.escape(key)}:\s*(\d+)", log)
            if m:
                out[key] = m.group(1)
    return out


def parse_inference(log: str) -> List[str]:
    """Passes that ran / features inferred, from the yosys log."""
    notes: List[str] = []
    patterns = [
        (r"\bproc\b", "procedural blocks converted to logic (proc)"),
        (r"\bopt_expr\b", "constant folding & expression optimization (opt_expr)"),
        (r"\balumacc\b", "adders merged into $alu (alumacc)"),
        (r"\bsharing\b", "resource sharing of operators (share)"),
        (r"\bopt_dff\b", "DFF optimization (opt_dff)"),
        (r"\babc9?\b", "boolean optimization + tech mapping (abc)"),
        (r"\bopt_lut\b", "LUT-level optimization (opt_lut)"),
        (r"\bmemory_collect\b|\bmemory\b", "memory inference (memory_collect)"),
        (r"\bfsm\b", "finite state machine inference (fsm)"),
        (r"\bdfflegalize\b", "DFF legalization for FPGA primitives (dfflegalize)"),
        (r"\bice40_opt\b", "iCE40-specific optimization (ice40_opt)"),
    ]
    for pat, note in patterns:
        if re.search(pat, log):
            notes.append(note)
    return notes


def parse_warnings(log: str, kind: str = "Warning") -> List[str]:
    out: List[str] = []
    for m in re.finditer(rf"{kind}:\s*(.+)", log):
        msg = m.group(1).strip()
        if msg and msg not in out:
            out.append(msg)
        if len(out) >= 30:
            break
    return out


def parse_sdc(root: Path) -> List[Tuple[str, str]]:
    """Parse constraints/*.sdc into (directive, statement)."""
    out: List[Tuple[str, str]] = []
    for f in sorted((root / "constraints").glob("*.sdc")):
        for line in read(f).splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            directive = line.split()[0]
            if directive in ("create_clock", "set_input_delay", "set_output_delay", "set_false_path", "set_max_delay", "set_multicycle_path", "set_clock_uncertainty"):
                out.append((directive, line[:110]))
    return out


def clock_period_ns(root: Path, default: float = 10.0) -> float:
    """Find the create_clock period from SDC constraints."""
    for f in sorted((root / "constraints").glob("*.sdc")):
        m = re.search(r"create_clock[^;]*?-period\s+([0-9.]+)", read(f))
        if m:
            return float(m.group(1))
    return default


def parse_pnr_log(root: Path, top: str) -> Dict[str, object]:
    """Extract routing/timing summaries from nextpnr logs."""
    candidates = sorted(list((root / "build" / "pnr").glob("*.log")) + list((root / "build" / "pnr").glob("*.rpt")))
    out: Dict[str, object] = {"success": False, "fmax_mhz": None, "congestion": None}
    for cf in candidates:
        text = read(cf)
        if "Routed successfully" in text or "converged" in text:
            out["success"] = True
        m = re.search(r"Max frequency for clock[^:]*:\s*([0-9.]+)\s*MHz", text)
        if m:
            out["fmax_mhz"] = float(m.group(1))
        m = re.search(r"Congestion:\s*(.+)", text)
        if m:
            out["congestion"] = m.group(1).strip()
    return out


def parse_icetime(root: Path, top: str) -> Dict[str, object]:
    out: Dict[str, object] = {}
    for f in list((root / "build" / "pnr").glob(f"{top}*.timing.rpt")) + list((root / "build" / "pnr").glob("*.icetime.rpt")):
        text = read(f)
        m = re.search(r"Fmax\s*:\s*([0-9.]+)\s*MHz", text)
        if m:
            out["fmax_mhz"] = float(m.group(1))
        m = re.search(r"Total path delay:\s*([0-9.]+)\s*ns", text)
        if m:
            out["total_delay_ns"] = float(m.group(1))
        m = re.search(r"Longest (?:path|chain):\s*([0-9.]+)\s*ns", text)
        if m:
            out["longest_delay_ns"] = float(m.group(1))
    return out


def netlist_cell_stats(root: Path, top: str) -> Dict[str, int]:
    """Read cell counts from the synthesized JSON (yosys write_json)."""
    stats: Dict[str, int] = {}
    jf = root / "build" / "synth" / f"{top}_synth.json"
    if not jf.exists():
        return stats
    try:
        j = json.loads(read(jf))
    except json.JSONDecodeError:
        return stats
    mods = j.get("modules", {})
    for mod in mods.values():
        for cell in mod.get("cells", {}).values():
            t = cell.get("type", "")
            stats[t] = stats.get(t, 0) + 1
    return stats


def coverage_stats(root: Path) -> Dict[str, object]:
    """Statement/toggle coverage from a Verilator coverage.dat."""
    out: Dict[str, object] = {"percent": 0.0, "covered": 0, "total": 0}
    dat = find_build(root, "coverage", "coverage.dat")
    if not dat.exists():
        # cocotb coverage.xml fallback
        xml = find_build(root, "coverage", "coverage.xml")
        if xml.exists():
            text = read(xml)
            total = sum(len(re.findall(r"<line-number>", b)) for b in [""])
            out["total"] = len(re.findall(r"<line>", text))
            out["covered"] = out["total"] - len(re.findall(r"branch=\"false\"", text))
            if out["total"]:
                out["percent"] = round(100.0 * out["covered"] / out["total"], 2)
        return out
    text = read(dat)
    rows = [l for l in text.splitlines() if l.startswith("C") and "\t" in l]
    out["total"] = len(rows)
    covered = 0
    for l in rows:
        m = re.match(r"C(\d+)\t", l)  # verilator: hit count attached to the C
        if m:
            if int(m.group(1)) > 0:
                covered += 1
        elif l.split("\t")[1].strip() not in ("", "0"):  # fallback: tabbed count
            covered += 1
    out["covered"] = covered
    if out["total"]:
        out["percent"] = round(100.0 * out["covered"] / out["total"], 2)
    return out


def pytest_stats(root: Path) -> Dict[str, object]:
    """Parse cocotb/pytest summary from build/sim logs and results.xml."""
    out: Dict[str, object] = {"passed": 0, "failed": 0, "skipped": 0, "duration_s": None}
    for f in list((root / "build" / "sim").glob("*.log")):
        text = read(f)
        m = re.search(r"(\d+)\s+passed", text)
        if m:
            out["passed"] = max(int(out["passed"]), int(m.group(1)))
        m = re.search(r"(\d+)\s+failed", text)
        if m:
            out["failed"] = max(int(out["failed"]), int(m.group(1)))
        m = re.search(r"in\s+([0-9.]+)s", text)
        if m:
            out["duration_s"] = float(m.group(1))
    for xf in list((root / "build" / "sim").glob("results.xml")) + list((root / "build" / "sim").glob("*.xml")):
        text = read(xf)
        m = re.search(r"tests=\"(\d+)\"", text)
        if m:
            out["passed"] = int(m.group(1)) - out.get("failed", 0)
        m = re.search(r"failures=\"(\d+)\"", text)
        if m:
            out["failed"] = int(m.group(1))
    return out


def formal_stats(root: Path) -> Dict[str, object]:
    """Summarize sby/yosys formal results."""
    out: Dict[str, object] = {"proven": 0, "counterexample": 0, "error": 0, "engines": []}
    for f in sorted((root / "build" / "formal").glob("*.txt")) + sorted((root / "build" / "formal").glob("*.log")):
        text = read(f)
        out["engines"].append(f.name)
        if re.search(r"\bSUCCESS\b|\bSAT\b", text):
            out["proven"] += 1
        if re.search(r"\bFAIL\b|\bUNSAT\b", text) and "ERROR" not in text:
            out["counterexample"] += 1
        if "ERROR" in text:
            out["error"] += 1
    for sub in (root / "build" / "formal").glob("*/status.txt"):
        out["engines"].append(str(sub))
    return out


# ---------------------------------------------------------------------------
# power model
# ---------------------------------------------------------------------------
# toggle-based estimate:  P = sum_cells C_eff * Vdd^2 * f_clk * alpha
CAPACITANCE_PF = {  # pF per resource type (typical FPGA estimates)
    "SB_LUT4": 0.60, "SB_CARRY": 0.35, "SB_DFF": 0.20, "SB_DFFSR": 0.22, "SB_DFFE": 0.20,
    "SB_DFFS": 0.22, "SB_DFFES": 0.22, "SB_DFFR": 0.20, "SB_DFFER": 0.20,
    "SB_IO": 0.30, "SB_RAM40_4K": 6.0, "SB_GB": 0.10, "LUT4": 0.60, "FDRE": 0.20,
}
DEFAULT_CAP_PF = 0.30
VDD_BY_ARCH = {"ice40": 1.2, "ecp5": 1.1, "nexus": 1.0, "generic": 1.2}


def estimate_power(root: Path, top: str, arch: str, alpha: float = 0.5, fmax_mhz: Optional[float] = None) -> Dict[str, object]:
    """Toggle-based power estimate from netlist cell counts.

    Only physical/hardware cells are counted: cells starting with ``SB_``
    (iCE40), ``LUT``/``FD*``/``CARRY`` (generic), plus ``$mul/$alu`` macros.
    Yosys-internal cells (``$scopeinfo``, ``$specify*``, ``$logic_*``) are
    excluded so the estimate reflects real switching resources.
    """
    all_cells = netlist_cell_stats(root, top)
    cells = {
        k: v for k, v in all_cells.items()
        if k.startswith(("SB_", "LUT", "FD", "CARRY", "IOB", "RAM", "DSP", "$mul", "$alu", "RAMS", "MULT"))
    }
    if not cells:  # fallback: any non-$ cell
        cells = {k: v for k, v in all_cells.items() if not k.startswith("$")}
    fmax = fmax_mhz or (parse_icetime(root, top).get("fmax_mhz") or (1000.0 / clock_period_ns(root)))
    vdd = VDD_BY_ARCH.get(arch, 1.2)
    per_cell: Dict[str, float] = {}
    total_w = 0.0
    for cell_type, count in cells.items():
        c = CAPACITANCE_PF.get(cell_type, DEFAULT_CAP_PF) * 1e-12
        p = count * c * vdd * vdd * (fmax * 1e6) * alpha
        per_cell[cell_type] = p
        total_w += p
    return {
        "cells": cells,
        "per_cell": per_cell,
        "total_mw": total_w * 1e3,
        "fmax_mhz": fmax,
        "vdd": vdd,
        "alpha": alpha,
    }


# ---------------------------------------------------------------------------
# report rendering helpers
# ---------------------------------------------------------------------------
def md_table(headers: Sequence[str], rows: Sequence[Sequence[str]]) -> str:
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for r in rows:
        out.append("| " + " | ".join(str(c) for c in r) + " |")
    return "\n".join(out)


def esc(s) -> str:
    return html.escape(str(s))


def write_out(out_dir: Path, name: str, content: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / name
    p.write_text(content, encoding="utf-8")
    return p


# ---------------------------------------------------------------------------
# sections
# ---------------------------------------------------------------------------
def section_synth(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    logf = find_build(root, "synth", f"{top}_synth.log")
    statf = find_build(root, "synth", f"{top}_synth.stat")
    statf = statf if statf.exists() else find_build(root, "synth", "stat.txt")
    log = read(logf)
    stat_log = read(statf) or log
    netlist = root / "build" / "synth" / f"{top}_netlist.v"

    cells = parse_yosys_stat(stat_log)
    res = parse_resource_summary(stat_log)
    inf = parse_inference(log)
    warns = parse_warnings(log)
    sdc = parse_sdc(root)
    cell_names = list(cells.keys())
    cell_vals = list(cells.values())
    top_cells = sorted(cells.items(), key=lambda kv: kv[1], reverse=True)[:8]

    total_cells = sum(cells.values())
    lut = cells.get("SB_LUT4", cells.get("LUT4", 0))
    carry = cells.get("SB_CARRY", 0)
    dff = sum(v for k, v in cells.items() if k.startswith("SB_DFF"))

    # --- markdown ------------------------------------------------------------
    md: List[str] = [f"# Synthesis Report — `{top}`", ""]
    md.append(f"> Generated {today()} · architecture `{arch}` · open-source toolchain (Yosys)")
    md.append("")

    # 1. synthesized netlist
    md.append("## Synthesized Netlist")
    md.append("")
    md.append(f"- **Netlist:** `build/synth/{top}_netlist.v` "
              f"({'present (' + str(netlist.stat().st_size) + ' B)' if netlist.exists() else '**MISSING**'})")
    md.append(f"- **JSON:** `build/synth/{top}_synth.json` (nextpnr input)")
    md.append(f"- **Total cells:** {total_cells} (LUT {lut}, Carry {carry}, DFF {dff})")
    md.append("")
    md.append(md_table(["Metric", "Value"], [
        ["Total cells", total_cells],
        ["LUT (SB_LUT4)", lut],
        ["Carry chains (SB_CARRY)", carry],
        ["Flip-flops (SB_DFF*)", dff],
        ["Top module", top],
        ["Architecture", arch],
    ]))
    md.append("")

    # 2. resource analysis
    md.append("## Resource Analysis")
    md.append("")
    if top_cells:
        md.append(md_table(["Cell type", "Count"], [[k, v] for k, v in top_cells]))
    else:
        md.append("_No cell counts found — run synthesis (`flow.sh synth`)._\n")
    md.append("")
    md.append(md_table(["Network metric", "Value"], [[k, v] for k, v in res.items()]))
    md.append("")

    # 2b. device budget utilization
    md.append("## Device Budget")
    md.append("")
    device = resolve_device(root)
    device_key = device.split("-")[0] if device else ""
    budget = DEVICE_BUDGET.get(arch, {}).get(device_key, {})
    if budget:
        util = device_utilization(cells, budget)
        md.append(md_table(["Resource", "Used", "Available", "Utilization"],
                           [[r, u, a, f"{p:.1f}%"] for r, u, a, p in util]))
        worst = max((p for _r, _u, _a, p in util), default=0.0)
        warn_row = "**Review:** resource utilization is tight (worst case "
        if worst >= 80:
            md.append(f"- {warn_row}{worst:.1f}%). Consider a larger device or optimization.\n")
        elif worst >= 50:
            md.append(f"- Moderate utilization (worst case {worst:.1f}%).\n")
        else:
            md.append(f"- Low utilization (worst case {worst:.1f}%) — headroom available.\n")
    else:
        md.append("_No device budget table for this architecture/device. "
                  "Set `device` in `openrtl-project.json` (e.g. `ice40up5k-sg48`)._\n")
    md.append("")

    # 3. inference analysis
    md.append("## Inference Analysis")
    md.append("")
    md.append("The following inference and optimization passes were active during synthesis:")
    md.append("")
    for note in inf:
        md.append(f"- {note}")
    if not inf:
        md.append("_No inference activity captured._")
    md.append("")

    # 4. synthesis reports
    md.append("## Synthesis Reports")
    md.append("")
    md.append(f"- Log: `build/synth/{top}_synth.log` ({len(log)} lines)")
    md.append(f"- Stat: `build/synth/{top}_synth.stat`")
    md.append(f"- Yosys version: {re.search(r'Yosys [0-9.]+.*', log).group(0) if re.search(r'Yosys [0-9.]+.*', log) else 'n/a'}")
    md.append("")

    # 5. warnings
    md.append("## Warnings")
    md.append("")
    if warns:
        md.append(md_table(["#", "Warning"], [[i + 1, f"`{esc(w)}`"] for i, w in enumerate(warns)]))
    else:
        md.append("_No warnings._")
    md.append("")

    # 6. constraint analysis
    md.append("## Constraint Analysis")
    md.append("")
    if sdc:
        md.append(md_table(["Directive", "Statement"], [[d, f"`{esc(s)}`"] for d, s in sdc]))
    else:
        md.append("_No SDC constraints found under `constraints/`._")
    md.append("")

    # 7. optimization results
    md.append("## Optimization Results")
    md.append("")
    md.append(f"Optimization performed by Yosys passes: `{', '.join(inf) if inf else 'none detected'}`.")
    md.append("")
    md.append(f"Result: **{total_cells} cells** post-optimization.")
    md.append("")

    # 8. quality assessment
    score = quality_score(root, top, arch)
    verdict = "PASS" if score >= 80 else "REVIEW" if score >= 50 else "FAIL"
    md.append("## Quality Assessment")
    md.append("")
    md.append(f"**Overall quality score: {score}/100 — {verdict}**")
    md.append("")
    md.append("Criteria: netlist produced, resource utilization within device, zero critical warnings, "
              "timing closure achieved, coverage above threshold.")
    md.append("")

    # --- charts ----------------------------------------------------------------
    svg_charts = []
    if top_cells:
        svg_charts.append(("resource-utilization.svg",
                           bar_chart([k for k, v in top_cells], [v for k, v in top_cells],
                                     title="Resource Utilization by Cell Type", subtitle=f"{total_cells} total cells",
                                     value_format="{:.0f}", horizontal=True)))
        svg_charts.append(("resource-mix.svg",
                           donut_chart([k for k, v in top_cells], [v for k, v in top_cells],
                                       title="Resource Mix", subtitle="Synthesized cell distribution")))
    if budget and budget.get("lut"):
        lut_pct = 100.0 * lut / budget["lut"]
        svg_charts.append(("device-utilization.svg",
                           gauge_chart(lut_pct, 100, f"LUT {lut_pct:.0f}%", title="Device LUT Utilization")))
    svg_charts.append(("quality-score.svg", gauge_chart(score, 100, "Quality score", title="Quality Assessment")))

    return {"md": "\n".join(md), "svg": svg_charts}


def section_pnr(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    pnr = parse_pnr_log(root, top)
    bitstreams = list((root / "build" / "pnr").glob(f"{top}.bin"))
    asc = list((root / "build" / "pnr").glob(f"{top}.asc"))
    configs = list((root / "build" / "pnr").glob(f"{top}.config"))
    ice = parse_icetime(root, top)

    md: List[str] = [f"# Place & Route Report — `{top}`", ""]
    md.append(f"> Generated {today()} · nextpnr-{arch} (open-source)")
    md.append("")
    md.append("## Routing Result")
    md.append("")
    status = "Routed successfully" if pnr["success"] else "Not routed yet"
    md.append(f"- **Status:** {status}")
    md.append(f"- **Fmax:** {pnr.get('fmax_mhz')} MHz" if pnr.get("fmax_mhz") else "- **Fmax:** pending")
    md.append(f"- **Congestion:** {pnr.get('congestion')}" if pnr.get("congestion") else "")
    md.append("")
    md.append("## Bitstream")
    md.append("")
    if bitstreams:
        b = bitstreams[0]
        md.append(f"- **Bitstream:** `build/pnr/{b.name}` ({b.stat().st_size} B)")
    else:
        md.append("- **Bitstream:** pending (run `flow.sh pnr`)")
    if asc:
        md.append(f"- **Asc:** `build/pnr/{asc[0].name}`")
    if configs:
        md.append(f"- **Config:** `build/pnr/{configs[0].name}`")
    md.append("")
    md.append("## I/O & Device")
    md.append("")
    md.append(md_table(["Item", "Value"], [
        ["Target", arch],
        ["Place & route engine", f"nextpnr-{arch}"],
        ["Design", top],
    ]))
    md.append("")

    charts = []
    if pnr.get("fmax_mhz"):
        charts.append(("fmax.svg", gauge_chart(float(pnr["fmax_mhz"]), 500, "Fmax (MHz)", title="Achieved Fmax")))
    return {"md": "\n".join(md), "svg": charts}


def section_timing(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    pnr = parse_pnr_log(root, top)
    ice = parse_icetime(root, top)
    period = clock_period_ns(root)
    target_mhz = 1000.0 / period
    fmax = ice.get("fmax_mhz") or pnr.get("fmax_mhz") or 0.0

    md: List[str] = [f"# Timing Closure Report — `{top}`", ""]
    md.append(f"> Generated {today()} · clock period constraint {period} ns → target {target_mhz:.1f} MHz")
    md.append("")
    md.append("## Achieved Timing")
    md.append("")
    md.append(md_table(["Metric", "Value"], [
        ["Target frequency", f"{target_mhz:.1f} MHz"],
        ["Achieved fmax", f"{fmax:.1f} MHz" if fmax else "pending"],
        ["Margin", f"{fmax - target_mhz:+.1f} MHz" if fmax else "pending"],
    ]))
    md.append("")
    if fmax:
        slack_ns = period - 1000.0 / fmax
        md.append(f"- **Slack:** {slack_ns:+.2f} ns (setup) — **{'MET' if slack_ns >= 0 else 'VIOLATED'}**")
        md.append(f"- Estimated via icetime/nextpnr STA (open-source).")
    else:
        md.append("- Timing not yet computed — run `flow.sh pnr` (nextpnr) then `flow.sh timing` (icetime).")
    md.append("")

    charts = []
    if fmax:
        charts.append(("timing-closure.svg", gauge_chart(max(0.0, min(fmax, 500)), 500, f"Fmax {fmax:.0f} / target {target_mhz:.0f} MHz",
                                                         title="Timing Closure")))
    return {"md": "\n".join(md), "svg": charts}


def section_power(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    power = estimate_power(root, top, arch)
    cells = power["cells"]
    per = power["per_cell"]
    total = power["total_mw"]

    md: List[str] = [f"# Power Consumption Report — `{top}`", ""]
    md.append(f"> Generated {today()} · toggle-based estimate (P = Σ C·V²·f·α), open-source")
    md.append("")
    md.append("## Estimate")
    md.append("")
    md.append(md_table(["Parameter", "Value"], [
        ["Vdd", f"{power['vdd']} V"],
        ["Clock", f"{power['fmax_mhz']} MHz"],
        ["Activity factor α", str(power["alpha"])],
        ["Estimated total", f"{total:.3f} mW"],
    ]))
    md.append("")
    md.append("## Breakdown")
    md.append("")
    if per:
        md.append(md_table(["Cell type", "Count", "Power (mW)"],
                           [[k, cells[k], f"{v*1e3:.3f}"] for k, v in sorted(per.items(), key=lambda kv: -kv[1])]))
    else:
        md.append("_No netlist — run `flow.sh synth` first._")
    md.append("")
    md.append("_Method: dynamic (switching) power modeled from netlist cell counts, per-cell capacitance "
              "estimates, supply voltage, clock frequency and a default activity factor. "
              "Static/leakage power is not modeled. For a measurement-grade number, run the P&R flow and "
              "measure on hardware._")
    md.append("")

    charts = []
    if per:
        charts.append(("power-breakdown.svg",
                       donut_chart([k for k in per], [v for k, v in per.items()],
                                   title="Dynamic Power Breakdown", subtitle=f"{total:.3f} mW total",
                                   center_label="mW")))
    return {"md": "\n".join(md), "svg": charts}


def section_coverage(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    cov = coverage_stats(root)
    pct = cov["percent"]
    md: List[str] = [f"# Coverage Report — `{top}`", ""]
    md.append(f"> Generated {today()} · Verilator statement/toggle coverage (open-source)")
    md.append("")
    md.append("## Coverage")
    md.append("")
    md.append(md_table(["Metric", "Value"], [
        ["Statement/toggle coverage", f"{pct:.1f}%"],
        ["Covered points", cov["covered"]],
        ["Total points", cov["total"]],
    ]))
    md.append("")
    if pct >= 90:
        md.append("**Result: PASS** — coverage exceeds the 90% gate.")
    elif pct > 0:
        md.append("**Result: REVIEW** — below the 90% gate; add stimulus for uncovered branches.")
    else:
        md.append("_No coverage data — run `flow.sh coverage`._")
    md.append("")

    charts = [("coverage.svg", gauge_chart(pct, 100, f"Coverage {pct:.0f}%", title="Statement/Toggle Coverage"))]
    return {"md": "\n".join(md), "svg": charts}


def section_formal(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    fs = formal_stats(root)
    md: List[str] = [f"# Formal Verification Report — `{top}`", ""]
    md.append(f"> Generated {today()} · SymbiYosys / yosys (open-source)")
    md.append("")
    md.append("## Engines")
    md.append("")
    if fs["engines"]:
        md.append(md_table(["Engine run", "Result"], [[f, "see logs"] for f in fs["engines"]]))
        md.append("")
        md.append(f"- Proven properties: **{fs['proven']}**")
        md.append(f"- Counter-examples found: **{fs['counterexample']}**")
        md.append(f"- Errors: {fs['error']}")
    else:
        md.append("_No formal runs found — add properties under `formal/` and run `flow.sh formal`._")
    md.append("")
    return {"md": "\n".join(md), "svg": []}


def section_sim(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    st = pytest_stats(root)
    md: List[str] = [f"# Simulation / Regression Report — `{top}`", ""]
    md.append(f"> Generated {today()} · cocotb + Icarus Verilog (open-source)")
    md.append("")
    md.append("## Results")
    md.append("")
    md.append(md_table(["Metric", "Value"], [
        ["Passed", st["passed"]],
        ["Failed", st["failed"]],
        ["Skipped", st["skipped"]],
        ["Duration (s)", f"{st['duration_s']:.1f}" if st["duration_s"] else "n/a"],
    ]))
    md.append("")
    verdict = "PASS" if st["failed"] == 0 and (st["passed"] > 0 or st["skipped"] > 0) else ("FAIL" if st["failed"] else "PENDING")
    md.append(f"**Result: {verdict}**")
    md.append("")
    return {"md": "\n".join(md), "svg": []}


def quality_score(root: Path, top: str, arch: str) -> int:
    """0..100 composite quality score across flows."""
    score = 0
    crit = 0

    # netlist produced
    if (root / "build" / "synth" / f"{top}_netlist.v").exists():
        score += 25
    crit += 25

    # routed
    pnr = parse_pnr_log(root, top)
    if pnr.get("success"):
        score += 20
    crit += 20

    # timing met
    ice = parse_icetime(root, top)
    period = clock_period_ns(root)
    fmax = ice.get("fmax_mhz") or pnr.get("fmax_mhz") or 0
    if fmax and fmax >= 1000.0 / period:
        score += 20
    elif fmax:
        score += 10
    crit += 20

    # coverage
    cov = coverage_stats(root)
    if cov["total"]:
        score += 20 if cov["percent"] >= 90 else 10 if cov["percent"] > 0 else 0
    else:
        score += 10
    crit += 20

    # no critical warnings
    log = read(find_build(root, "synth", f"{top}_synth.log"))
    crit_warns = parse_warnings(log, "ERROR") or [w for w in parse_warnings(log) if re.search(r"dangling|multi-driven|unknown cell", w, re.I)]
    if not crit_warns:
        score += 15
    crit += 15

    return round(100 * score / crit)


def section_quality(root: Path, top: str, arch: str, out_dir: Path) -> Dict[str, str]:
    score = quality_score(root, top, arch)
    pnr = parse_pnr_log(root, top)
    ice = parse_icetime(root, top)
    cov = coverage_stats(root)
    period = clock_period_ns(root)
    fmax = ice.get("fmax_mhz") or pnr.get("fmax_mhz") or 0
    st = pytest_stats(root)

    verdict = "PASS" if score >= 80 else "REVIEW" if score >= 50 else "FAIL"
    md: List[str] = [f"# Quality Assessment — `{top}`", ""]
    md.append(f"> Generated {today()}")
    md.append("")
    md.append(f"**Overall score: {score}/100 — {verdict}**")
    md.append("")
    md.append("## Criteria")
    md.append("")
    md.append(md_table(["Criterion", "Status", "Weight"], [
        ["Netlist synthesized", "✓" if (root / "build" / "synth" / f"{top}_netlist.v").exists() else "✗", "25"],
        ["Place & route converged", "✓" if pnr.get("success") else "✗", "20"],
        ["Timing closure", f"{fmax:.1f} MHz vs {1000.0/period:.1f} MHz" if fmax else "pending", "20"],
        ["Coverage ≥ 90%", f"{cov['percent']:.1f}%" if cov["total"] else "n/a", "20"],
        ["No critical warnings", "✓" if not parse_warnings(read(find_build(root, "synth", f"{top}_synth.log")), "ERROR") else "✗", "15"],
    ]))
    md.append("")
    md.append(f"Simulation regression: {st['passed']} passed, {st['failed']} failed.")
    md.append("")

    charts = [("quality-score.svg", gauge_chart(score, 100, "Overall quality", title="Quality Score"))]
    return {"md": "\n".join(md), "svg": charts}


SECTIONS = {
    "synth": section_synth,
    "pnr": section_pnr,
    "timing": section_timing,
    "power": section_power,
    "coverage": section_coverage,
    "formal": section_formal,
    "sim": section_sim,
    "quality": section_quality,
}

PHASE_BY_SECTION = {
    "sim": "22-simulation",
    "formal": "23-formal-verification",
    "synth": "24-synthesis",
    "pnr": "25-place-and-route",
    "timing": "26-timing-closure",
    "power": "24-synthesis",
    "coverage": "22-simulation",
    "quality": "29-system-validation",
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("section", nargs="?", default="all", choices=list(SECTIONS) + ["all", "handoff"])
    ap.add_argument("--project", "-p", default=".", help="project root (auto-detected by walking up)")
    ap.add_argument("--top", default="", help="top module name (default: auto-detect)")
    ap.add_argument("--arch", default="", choices=["", "ice40", "ecp5", "nexus", "generic"])
    ap.add_argument("--out", "-o", default="", help="output dir (default: docs/<phase>/reports)")
    ap.add_argument("--activity", type=float, default=0.5, help="power activity factor α")
    args = ap.parse_args()

    root = find_project(Path(args.project))
    top = resolve_top(root, args.top)
    arch = resolve_arch(root, args.arch)
    print(f"report: project={root} top={top} arch={arch}")

    if args.section == "handoff":
        return handoff(root, top, arch, args.out)

    out_dir = Path(args.out) if args.out else root / "docs" / PHASE_BY_SECTION.get(args.section, "24-synthesis") / "reports"

    if args.section == "all":
        for name in SECTIONS:
            write_section(name, root, top, arch, out_dir)
        # index
        idx = ["# OpenRTL Reports", ""]
        idx.append(f"> Generated {today()} · project `{root.name}` · top `{top}` · arch `{arch}`")
        idx.append("")
        for name in SECTIONS:
            idx.append(f"- [{name}]({name}.md)")
        idx.append("")
        write_out(out_dir, "index.md", "\n".join(idx))
        print(f"reports written -> {out_dir}")
        return 0

    write_section(args.section, root, top, arch, out_dir)
    print(f"report written -> {out_dir}")
    return 0


def write_section(name: str, root: Path, top: str, arch: str, out_dir: Path) -> None:
    res = SECTIONS[name](root, top, arch, out_dir)
    write_out(out_dir, f"{name}.md", res["md"])
    for fname, svg in res.get("svg", []):
        write_out(out_dir, fname, svg)


def handoff(root: Path, top: str, arch: str, out_dir: str) -> int:
    """Zip the reports + netlist + bitstream for delivery."""
    stamp = _dt.datetime.now().strftime("%Y%m%d")
    dest = Path(out_dir) if out_dir else root / "docs" / "34-release" / "handoff"
    dest.mkdir(parents=True, exist_ok=True)
    zpath = dest / f"{root.name}-handoff-{stamp}.zip"

    names = []
    for f in list((root / "docs").rglob("**/reports/*.md")) + list((root / "docs").rglob("**/reports/*.svg")):
        if "reports" in str(f):
            names.append(f)
    for pat in (f"{top}_netlist.v", f"{top}_synth.json", "*.bin", "*.asc", "*.config"):
        names.extend((root / "build" / "synth" if "netlist" in pat or "synth" in pat else root / "build" / "pnr").glob(pat))

    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(set(names)):
            z.write(f, f.relative_to(root))
    print(f"handoff package -> {zpath} ({zpath.stat().st_size} B, {len(set(names))} files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
