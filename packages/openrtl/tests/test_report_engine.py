#!/usr/bin/env python3
"""
OpenRTL — test_report_engine.py : unit tests for the report engine.

Covers the parsers (yosys stat, resource summary, warnings, SDC, netlist
JSON, coverage.dat, pytest logs), the power model math, SVG validity for
every chart kind, quality scoring, and markdown helpers.

Run directly (`python3 test_report_engine.py`) or via pytest
(`pytest test_report_engine.py`) — both work with zero third-party deps
for the direct path.

Exit code 0 = all pass; 1 = any failure (CI-friendly).
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import traceback
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPORT_DIR = HERE.parent / "report"
sys.path.insert(0, str(REPORT_DIR))

import report  # noqa: E402
import svg  # noqa: E402

# ---------------------------------------------------------------------------
# sample tool output (realistic slices)
# ---------------------------------------------------------------------------
STAT_TEE = """\
9. Printing statistics.
=== counter ===
        +----------Local Count, excluding submodules.
        |
       61 wires
      143 wire bits
       61 public wires
      143 public wire bits
       11 ports
       22 port bits
       64 cells
        2   $scopeinfo
        8   SB_CARRY
        7   SB_DFFER
        2   SB_DFFR
       45   SB_LUT4
"""

STAT_SCRIPT = """\
=== counter ===
   Number of cells: 10
     SB_CARRY   4
     SB_DFFSR   5
   Number of wires: 10
   Number of wire bits: 56
   Number of ports: 5
   Number of port bits: 34
   Number of processes: 0
"""

SYNTH_LOG = """\
Yosys 0.66
-- Running command `proc` --
-- Running command `alumacc` --
-- Running command `opt_expr` --
-- Running command `abc9` --
Warning: The network is combinational.
ERROR: something exploded
"""

COVERAGE_DAT = """\
C1\t/counter.v\t3\t1\t0\t0
C0\t/counter.v\t4\t1\t0\t0
C2\t/counter.v\t5\t1\t0\t0
"""

PYTEST_LOG = """\
============================= test session starts ==============================
collected 4 items
tb/test_counter.py ....                                         [100%]
============================== 4 passed, 0 failed, 0 skipped in 0.12s ==========
"""

SDC = """\
create_clock -name clk -period 20.000 [get_ports clk]
set_input_delay -clock clk -max 8.0 [get_ports a]
# comment line is ignored
set_output_delay -clock clk -max 0.0 [get_ports y]
"""

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
_checks = 0
_failures = 0


def check(name, fn):
    global _checks, _failures
    _checks += 1
    try:
        fn()
    except AssertionError as exc:
        _failures += 1
        print(f"  FAIL {name}: {exc}")
        return
    except Exception as exc:  # noqa: BLE001
        _failures += 1
        print(f"  FAIL {name}: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        return
    print(f"  PASS {name}")


def make_project(tmp: Path) -> Path:
    """Create a minimal fake project tree with one synthesizable module."""
    root = tmp / "proj"
    (root / "rtl").mkdir(parents=True)
    (root / "build/synth").mkdir(parents=True)
    (root / "constraints").mkdir(parents=True)
    (root / "build/pnr").mkdir(parents=True)
    (root / "docs/00-project/decisions").mkdir(parents=True)
    (root / "rtl/counter.v").write_text(
        "module counter(input clk, rst_n, en, output reg [7:0] count);\n"
        "always @(posedge clk or negedge rst_n) begin\n"
        "  if (!rst_n) count <= 8'h0;\n"
        "  else if (en) count <= count + 1;\n"
        "end\nendmodule\n"
    )
    (root / "constraints/counter.sdc").write_text(SDC)
    return root


# ---------------------------------------------------------------------------
# parsers
# ---------------------------------------------------------------------------
def test_parse_yosys_stat_tee():
    counts = report.parse_yosys_stat(STAT_TEE)
    assert counts.get("SB_LUT4") == 45, counts
    assert counts.get("SB_CARRY") == 8, counts
    assert counts.get("SB_DFFER") == 7, counts
    assert "$scopeinfo" not in counts  # $-cells excluded from hardware counts
    assert "wires" not in counts  # summary words must not be treated as cells


def test_parse_yosys_stat_script():
    counts = report.parse_yosys_stat(STAT_SCRIPT)
    assert counts.get("SB_CARRY") == 4, counts
    assert counts.get("SB_DFFSR") == 5, counts


def test_parse_resource_summary():
    res = report.parse_resource_summary(STAT_TEE)
    assert res["wires"] == "61", res
    assert res["wire bits"] == "143", res
    assert res["ports"] == "11", res
    assert res["port bits"] == "22", res


def test_parse_resource_summary_script():
    res = report.parse_resource_summary(STAT_SCRIPT)
    assert res["wires"] == "10", res
    assert res["processes"] == "0", res


def test_parse_inference():
    inf = report.parse_inference(SYNTH_LOG)
    joined = " ".join(inf)
    assert "alumacc" in joined
    assert "abc" in joined
    assert "constant folding" in joined


def test_parse_warnings():
    warns = report.parse_warnings(SYNTH_LOG)
    assert any("combinational" in w for w in warns), warns
    assert len(warns) >= 1


def test_parse_sdc():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "constraints").mkdir()
    (tmp / "constraints/counter.sdc").write_text(SDC)
    rows = report.parse_sdc(tmp)
    assert len(rows) == 3, rows  # comments ignored
    assert rows[0][0] == "create_clock"
    assert rows[0][1].startswith("create_clock -name clk -period")


def test_clock_period():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "constraints").mkdir()
    (tmp / "constraints/counter.sdc").write_text(SDC)
    assert report.clock_period_ns(tmp) == 20.0


def test_netlist_cell_stats():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "build/synth").mkdir(parents=True)
    (tmp / "build/synth/counter_synth.json").write_text(json.dumps({
        "modules": {
            "counter": {
                "cells": {
                    "u0": {"type": "SB_LUT4"},
                    "u1": {"type": "SB_CARRY"},
                    "u2": {"type": "SB_LUT4"},
                }
            }
        }
    }))
    stats = report.netlist_cell_stats(tmp, "counter")
    assert stats.get("SB_LUT4") == 2, stats
    assert stats.get("SB_CARRY") == 1, stats


def test_coverage_stats():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "build/coverage").mkdir(parents=True)
    (tmp / "build/coverage/coverage.dat").write_text(COVERAGE_DAT)
    cov = report.coverage_stats(tmp)
    assert cov["total"] == 3, cov
    assert cov["covered"] == 2, cov
    assert cov["percent"] == 66.67, cov


def test_pytest_stats():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "build/sim").mkdir(parents=True)
    (tmp / "build/sim/sim.log").write_text(PYTEST_LOG)
    st = report.pytest_stats(tmp)
    assert st["passed"] == 4, st
    assert st["failed"] == 0, st
    assert st["duration_s"] == 0.12, st


# ---------------------------------------------------------------------------
# power model
# ---------------------------------------------------------------------------
def test_estimate_power():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "build/synth").mkdir(parents=True)
    (tmp / "build/synth/counter_synth.json").write_text(json.dumps({
        "modules": {"counter": {"cells": {
            "a": {"type": "SB_LUT4"}, "b": {"type": "SB_LUT4"},
            "c": {"type": "SB_DFFER"}, "d": {"type": "SB_CARRY"},
        }}}
    }))
    p = report.estimate_power(tmp, "counter", "ice40", alpha=0.5)
    assert p["total_mw"] > 0, p
    assert p["cells"]["SB_LUT4"] == 2, p
    # internal cells excluded
    assert all(not k.startswith("$") for k in p["cells"]), p["cells"]
    # 2 LUTs at 0.6 pF, 1.2V, 100 MHz, alpha 0.5
    #   P = N * C * V^2 * f * a = 2 * 0.6e-12 * 1.44 * 100e6 * 0.5 = 8.64e-5 W = 0.0864 mW
    lut_p = p["per_cell"]["SB_LUT4"] * 1e3
    assert abs(lut_p - 0.0864) < 1e-6, lut_p


def test_estimate_power_no_netlist():
    tmp = tempfile.mkdtemp()
    p = report.estimate_power(Path(tmp), "none", "ice40")
    assert p["total_mw"] == 0.0, p


# ---------------------------------------------------------------------------
# svg validity
# ---------------------------------------------------------------------------
def _valid_svg(text: str) -> bool:
    root = ET.fromstring(text)
    return root.tag.endswith("svg")


def test_svg_bar():
    assert _valid_svg(svg.bar_chart(["a", "b"], [1, 2], title="T"))


def test_svg_hbar():
    assert _valid_svg(svg.hbar_chart(["a", "b"], [3, 4], title="T"))


def test_svg_donut():
    assert _valid_svg(svg.donut_chart(["a", "b"], [1, 2], title="T"))


def test_svg_line():
    assert _valid_svg(svg.line_chart([[1, 2, 3], [3, 2, 1]], ["x", "y", "z"], title="T"))


def test_svg_gauge():
    assert _valid_svg(svg.gauge_chart(50, 100, "util"))


def test_svg_stacked():
    assert _valid_svg(svg.stacked_bar_chart(["a", "b"], [[1, 2], [2, 1]], ["s1", "s2"], title="T"))


def test_svg_histogram():
    assert _valid_svg(svg.histogram([1, 2, 2, 3, 3, 3, 4, 5], bins=5, title="H"))


def test_svg_empty_handled():
    # must not crash on empty data
    _valid_svg(svg.bar_chart([], [], title="empty"))
    _valid_svg(svg.histogram([], title="empty"))


# ---------------------------------------------------------------------------
# quality scoring + sections (against a real temp project)
# ---------------------------------------------------------------------------
def test_quality_score_flow():
    tmp = Path(tempfile.mkdtemp())
    root = make_project(tmp)
    # synthesize via flow.sh path by writing a real netlist + log
    (root / "build/synth/counter_netlist.v").write_text("// netlist\n")
    (root / "build/synth/counter_synth.log").write_text("Yosys 0.66\nhierarchy check done\n")
    (root / "build/synth/counter_synth.stat").write_text(STAT_TEE)
    (root / "build/pnr/pnr.log").write_text(
        "Info: Routing..\nRouted successfully\nMax frequency for clock 'clk': 120.00 MHz\n"
    )
    (root / "build/coverage").mkdir(exist_ok=True)
    (root / "build/coverage/coverage.dat").write_text(COVERAGE_DAT)
    score = report.quality_score(root, "counter", "ice40")
    assert score >= 80, score  # netlist + routed + timing + coverage + no crit warnings


def test_section_synth_renders():
    tmp = Path(tempfile.mkdtemp())
    root = make_project(tmp)
    (root / "openrtl-project.json").write_text('{"device": "ice40up5k-sg48", "arch": "ice40"}')
    (root / "build/synth/counter_synth.log").write_text(SYNTH_LOG)
    (root / "build/synth/counter_synth.stat").write_text(STAT_TEE)
    (root / "build/synth/counter_netlist.v").write_text("// netlist\n")
    out = root / "out"
    res = report.section_synth(root, "counter", "ice40", out)
    md = res["md"]
    assert "## Synthesized Netlist" in md
    assert "## Resource Analysis" in md
    assert "## Device Budget" in md
    assert "## Inference Analysis" in md
    assert "## Warnings" in md
    assert "## Constraint Analysis" in md
    assert "## Optimization Results" in md
    assert "## Quality Assessment" in md
    assert "SB_LUT4" in md
    assert "Utilization" in md
    assert any(f[0] == "device-utilization.svg" for f in res["svg"])
    assert any(f[0].endswith(".svg") for f in res["svg"])


def test_md_table():
    t = report.md_table(["A", "B"], [["1", "2"], ["3", "4"]])
    assert t.startswith("| A | B |"), t
    assert t.count("|---") == 2, t


def test_resolve_device():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "openrtl-project.json").write_text('{"device": "ice40up5k-sg48"}')
    assert report.resolve_device(tmp) == "ice40up5k-sg48"
    assert report.resolve_device(Path(tempfile.mkdtemp())) == ""


def test_device_utilization():
    cells = {"SB_LUT4": 45, "SB_DFFER": 7, "SB_DFFR": 2}
    util = report.device_utilization(cells, report.DEVICE_BUDGET["ice40"]["ice40up5k"])
    lut = next(r for r in util if r[0] == "LUT")
    assert lut[1] == 45 and lut[2] == 5280, lut
    assert abs(lut[3] - 100.0 * 45 / 5280) < 1e-9, lut
    ff = next(r for r in util if r[0] == "FF")
    assert ff[1] == 9, ff  # SB_DFFER + SB_DFFR both start with SB_DFF


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main() -> int:
    print("report engine unit tests")
    print("------------------------------------------------------")
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in tests:
        check(fn.__name__.replace("test_", ""), fn)
    print("------------------------------------------------------")
    print(f"  {_checks - _failures}/{_checks} passed, {_failures} failed")
    return 1 if _failures else 0


if __name__ == "__main__":
    sys.exit(main())
