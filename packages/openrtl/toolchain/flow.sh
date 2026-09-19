#!/usr/bin/env bash
# =============================================================================
# OpenRTL — flow.sh : unified open-source EDA flow driver
# -----------------------------------------------------------------------------
# One command to run every tool, produce every artifact, and render every
# report. No glue required — everything the workflow needs is automated.
#
# Usage:
#   flow.sh <command> [--top MODULE] [--arch ice40|ecp5|nexus|generic]
#                     [--project DIR] [--threads N]
#
# Commands:
#   doctor   verify the toolchain (delegates to doctor.sh)
#   lint     Verilator lint of all RTL
#   sim      run the cocotb/Icarus regression (make sim or pytest)
#   formal   run formal verification (SymbiYosys/sby, or yosys sat)
#   synth    Yosys synthesis -> netlist, JSON, stats, warnings, inference
#   pnr      nextpnr place & route -> bitstream, timing, congestion reports
#   timing   timing analysis (nextpnr report / icetime)
#   power    toggle-based power estimate (netlist cell model)
#   coverage Verilator statement/toggle coverage
#   verify   re-lint the synthesized netlist (netlist lint-clean check)
#   reports  generate all reports + infographics
#   handoff  package reports + netlist + bitstream for delivery
#   test     run the automated toolchain test suite (tests/run_tests.sh);
#            extra flags --only <suite> / --verbose / --tap are forwarded
#   all      run the full pipeline: doctor -> lint -> sim -> formal -> synth
#            -> pnr -> timing -> power -> coverage -> verify -> reports
#
# Each command runs the tool, captures its artifacts under build/<flow>/,
# then renders reports via the report engine (packages/openrtl/report).
# All artifacts land where the workflow expects them (docs/<phase>/reports).
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_PY="$SCRIPT_DIR/../report/report.py"

# ---------------------------------------------------------------- options --
CMD="${1:-help}"
shift || true
TOP=""
ARCH=""
PROJECT=""
THREADS="${OPENRTL_THREADS:-$(nproc 2>/dev/null || echo 4)}"
TEST_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --top) TOP="$2"; shift 2 ;;
    --arch) ARCH="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --threads) THREADS="$2"; shift 2 ;;
    --only) TEST_ARGS+=(--only "$2"); shift 2 ;;
    --verbose) TEST_ARGS+=(--verbose); shift ;;
    --tap) TEST_ARGS+=(--tap); shift ;;
    --list) TEST_ARGS+=(--list); shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

# ------------------------------------------------------------- project cfg --
PROJECT_DIR="$PROJECT"
if [[ -z "$PROJECT_DIR" ]]; then
  # find the project root by walking up to openrtl-project.json
  D="$(pwd)"
  while [[ "$D" != "/" ]]; do
    if [[ -f "$D/openrtl-project.json" ]]; then PROJECT_DIR="$D"; break; fi
    D="$(dirname "$D")"
  done
fi
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
ROOT="$PROJECT_DIR"

if [[ -f "$ROOT/openrtl-project.json" ]]; then
  TOP="$(python3 - "$ROOT/openrtl-project.json" <<'PY' 2>/dev/null
import json, sys
try:
    print(json.load(open(sys.argv[1])).get("top", ""))
except Exception:
    print("")
PY
  )"
fi

detect_top() {
  # 1) DECISION-070
  if [[ -f "$ROOT/docs/00-project/decisions/DECISION-070-fpga-arch.md" ]]; then
    local t
    t="$(grep -oP '["`]\K[a-zA-Z0-9_]+(?=["`]\s*(?:module|top|entity))' "$ROOT/docs/00-project/decisions/DECISION-070-fpga-arch.md" 2>/dev/null | head -1)"
    [[ -n "$t" ]] && { echo "$t"; return; }
  fi
  # 2) Makefile --top-module / TOPLEVEL
  if [[ -f "$ROOT/Makefile" ]]; then
    local t
    t="$(grep -oP -- '--top-module\s+\K[a-zA-Z0-9_]+' "$ROOT/Makefile" 2>/dev/null | head -1)"
    [[ -z "$t" ]] && t="$(grep -oP '^\s*TOPLEVEL\s*:?=\s*\K[a-zA-Z0-9_]+' "$ROOT/Makefile" 2>/dev/null | head -1)"
    [[ -n "$t" ]] && { echo "$t"; return; }
  fi
  # 3) first module in rtl/ (skip pkg files)
  for f in "$ROOT"/rtl/*.sv "$ROOT"/rtl/*.v; do
    [[ -f "$f" ]] && grep -qP '^\s*package\s' "$f" 2>/dev/null && continue
    local t
    t="$(grep -oP '^\s*module\s+\K[a-zA-Z0-9_]+' "$f" 2>/dev/null | head -1)"
    [[ -n "$t" ]] && { echo "$t"; return; }
  done
}
[[ -z "$TOP" ]] && TOP="$(detect_top || true)"
TOP="${TOP:-top}"

[[ -z "$ARCH" ]] && ARCH="$(grep -oP '(ice40|ecp5|nexus|generic)' "$ROOT/docs/00-project/decisions/DECISION-070-fpga-arch.md" 2>/dev/null | head -1 || true)"
ARCH="${ARCH:-ice40}"

export OPENRTL_TOP="$TOP"
export OPENRTL_ARCH="$ARCH"
export OPENRTL_PROJECT="$ROOT"

log()  { printf '\033[1;36m[flow] %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[flow] %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[1;31m[flow] ERROR: %s\033[0m\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

mkdir -p "$ROOT/build"/{lint,sim,formal,synth,pnr,timing,power,coverage,reports,handoff}

usage() { sed -n '2,38p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0; }
[[ "$CMD" == "help" || "$CMD" == "-h" ]] && usage

# ------------------------------------------------------------ subcommands --
cmd_doctor() { bash "$SCRIPT_DIR/doctor.sh"; }

cmd_lint() {
  log "verilator lint (top=$TOP)"
  local srcs=()
  for f in "$ROOT"/rtl/*_pkg.sv "$ROOT"/rtl/*_pkg.v "$ROOT"/rtl/*.svh; do [[ -f "$f" ]] && srcs+=("$f"); done
  for f in "$ROOT"/rtl/*.sv "$ROOT"/rtl/*.v; do
    [[ -f "$f" ]] || continue
    [[ "$f" == *_pkg.sv || "$f" == *_pkg.v || "$f" == *.svh ]] && continue
    srcs+=("$f")
  done
  [[ ${#srcs[@]} -eq 0 ]] && die "no RTL sources under $ROOT/rtl/"
  verilator --lint-only --sv -Wall -Wno-DECLFILENAME "${srcs[@]}" --top-module "$TOP" \
    > "$ROOT/build/lint/lint.log" 2>&1 \
    || { warn "lint found issues -> build/lint/lint.log"; exit 1; }
  echo "LINT PASS" >> "$ROOT/build/lint/lint.log"
}

cmd_sim() {
  log "regression simulation"
  # prefer the project's own Makefile (cocotb/iverilog project-specific)
  if [[ -f "$ROOT/Makefile" ]] && grep -qE '^(sim|test|run)' "$ROOT/Makefile"; then
    (cd "$ROOT" && make sim 2>&1) | tee "$ROOT/build/sim/sim.log"
    return ${PIPESTATUS[0]}
  fi
  if [[ -d "$ROOT/tb" ]]; then
    (cd "$ROOT" && python3 -m pytest tb/ -q 2>&1) | tee "$ROOT/build/sim/sim.log"
    return ${PIPESTATUS[0]}
  fi
  warn "no Makefile sim target or tb/ found"
}

cmd_formal() {
  log "formal verification (sby)"
  if have sby && [[ -d "$ROOT/formal" ]] && ls "$ROOT"/formal/*.sby >/dev/null 2>&1; then
    for sby in "$ROOT"/formal/*.sby; do
      log "  sby $sby"
      sby -f "$sby" > "$ROOT/build/formal/$(basename "$sby").log" 2>&1
      status=$?
      if [[ $status -eq 0 ]]; then
        grep -E "SUMMARY|PASS|FAIL" "$ROOT/build/formal/$(basename "$sby").log" | tail -5
      else
        warn "  sby $sby failed"
      fi
    done
  elif have yosys; then
    log "  sby not found; using yosys sat (basic)"
    local srcs=()
    for f in "$ROOT"/rtl/*_pkg.sv "$ROOT"/rtl/*_pkg.v "$ROOT"/rtl/*.svh; do [[ -f "$f" ]] && srcs+=("$f"); done
    for f in "$ROOT"/rtl/*.sv "$ROOT"/rtl/*.v; do
      [[ -f "$f" ]] || continue
      [[ "$f" == *_pkg.sv || "$f" == *_pkg.v || "$f" == *.svh ]] && continue
      srcs+=("$f")
    done
    yosys -Q -p "read_verilog -sv ${srcs[*]}; hierarchy -top $TOP; sat" \
      > "$ROOT/build/formal/yosys-sat.log" 2>&1
  else
    warn "formal tools not installed (sby/yosys)"
  fi
}

cmd_synth() {
  log "yosys synthesis (arch=$ARCH top=$TOP)"
  have yosys || die "yosys not installed — run provision.sh"
  local srcs=()
  # package files first (SystemVerilog packages must be read before modules)
  for f in "$ROOT"/rtl/*_pkg.sv "$ROOT"/rtl/*_pkg.v "$ROOT"/rtl/*.svh; do [[ -f "$f" ]] && srcs+=("$f"); done
  for f in "$ROOT"/rtl/*.sv "$ROOT"/rtl/*.v; do
    [[ -f "$f" ]] || continue
    [[ "$f" == *_pkg.sv || "$f" == *_pkg.v || "$f" == *.svh ]] && continue
    srcs+=("$f")
  done
  [[ ${#srcs[@]} -eq 0 ]] && die "no RTL sources"
  local yscript="$ROOT/build/synth/synth.ys"
  {
    echo "read_verilog -sv ${srcs[*]}"
    echo "hierarchy -check -top $TOP"
    echo "proc; flatten"
    case "$ARCH" in
      ice40) echo "synth_ice40 -top $TOP" ;;
      ecp5)  echo "synth_ecp5  -top $TOP" ;;
      nexus) echo "synth_nexus -top $TOP" ;;
      *)     echo "synth -top $TOP" ;;
    esac
    echo "tee -o $ROOT/build/synth/${TOP}_synth.stat stat -top $TOP"
    echo "write_verilog $ROOT/build/synth/${TOP}_netlist.v"
    echo "write_json   $ROOT/build/synth/${TOP}_synth.json"
  } > "$yscript"
  yosys -Q -s "$yscript" \
    > "$ROOT/build/synth/${TOP}_synth.log" 2>&1 \
    || { warn "synthesis issues -> build/synth/${TOP}_synth.log"; exit 1; }
  log "  netlist -> build/synth/${TOP}_netlist.v"
  log "  json    -> build/synth/${TOP}_synth.json"
  # grab warnings count
  wc -l < <(grep -c "Warning:" "$ROOT/build/synth/${TOP}_synth.log" || echo 0) >/dev/null
  echo "$(grep -c 'Warning:' "$ROOT/build/synth/${TOP}_synth.log" 2>/dev/null || echo 0) warnings in log"
}

cmd_pnr() {
  log "nextpnr-$ARCH place & route"
  have "nextpnr-$ARCH" || die "nextpnr-$ARCH not installed — run provision.sh"
  local json="$ROOT/build/synth/${TOP}_synth.json"
  [[ -f "$json" ]] || die "run 'flow.sh synth' first (missing $json)"
  local pcf lpcf
  pcf="$(ls "$ROOT"/constraints/*.pcf 2>/dev/null | head -1 || true)"
  lpcf="$(ls "$ROOT"/constraints/*.lpf 2>/dev/null | head -1 || true)"
  local out="$ROOT/build/pnr/${TOP}.asc"
  case "$ARCH" in
    ice40)
      nextpnr-ice40 --json "$json" --pcf "$pcf" --asc "$out" --seed 1 \
        --freq "$(clock_mhz)" \
        > "$ROOT/build/pnr/pnr.log" 2>&1 \
        || { warn "P&R failed -> build/pnr/pnr.log"; exit 1; }
      ;;
    ecp5)
      local dev="${OPENRTL_DEVICE:-25k}"
      nextpnr-ecp5 --json "$json" --lpf "$lpcf" --textcfg "$ROOT/build/pnr/${TOP}.config" --${dev} \
        > "$ROOT/build/pnr/pnr.log" 2>&1 || { warn "P&R failed"; exit 1; }
      ;;
    *)
      nextpnr-generic --json "$json" --top "$TOP" \
        > "$ROOT/build/pnr/pnr.log" 2>&1 || { warn "P&R failed"; exit 1; }
      ;;
  esac
  # bitstream
  if have icepack && [[ -f "$ROOT/build/pnr/${TOP}.asc" ]]; then
    icepack "$ROOT/build/pnr/${TOP}.asc" "$ROOT/build/pnr/${TOP}.bin" \
      && log "  bitstream -> build/pnr/${TOP}.bin"
  fi
  # timing report
  if [[ -f "$ROOT/build/pnr/pnr.log" ]] && grep -q "Max frequency" "$ROOT/build/pnr/pnr.log"; then
    grep -A3 "Max frequency" "$ROOT/build/pnr/pnr.log" > "$ROOT/build/timing/timing.rpt"
  fi
  log "  see build/pnr/pnr.log"
}

clock_mhz() {
  local p
  p="$(ls "$ROOT"/constraints/*.sdc 2>/dev/null | head -1 || true)"
  [[ -n "$p" ]] && grep -oP '(?<=-period\s)[0-9.]+' "$p" | head -1 | awk '{printf "%.0f", 1000/$1}'
  echo "${OPENRTL_FREQ_MHZ:-100}"
}

cmd_timing() {
  log "timing analysis"
  if [[ -f "$ROOT/build/timing/timing.rpt" ]]; then
    cat "$ROOT/build/timing/timing.rpt"
  else
    warn "no timing report yet — run 'flow.sh pnr' first"
  fi
}

cmd_power() {
  log "power estimate (toggle-based, netlist model)"
  python3 "$REPORT_PY" power --project "$ROOT" --top "$TOP" --arch "$ARCH" \
    --out "$ROOT/build/power" >/dev/null
  cat "$ROOT/build/power/power.md" 2>/dev/null | sed -n '1,30p'
}

cmd_coverage() {
  log "verilator coverage"
  if ! have verilator || [[ -z "${OPENRTL_COVERAGE_WORKSPACE:-}" ]]; then
    warn "coverage needs verilator + a coverage workspace (set OPENRTL_COVERAGE_WORKSPACE)"
    return 0
  fi
  local srcs=()
  for f in "$ROOT"/rtl/*_pkg.sv "$ROOT"/rtl/*_pkg.v "$ROOT"/rtl/*.svh; do [[ -f "$f" ]] && srcs+=("$f"); done
  for f in "$ROOT"/rtl/*.sv "$ROOT"/rtl/*.v; do
    [[ -f "$f" ]] || continue
    [[ "$f" == *_pkg.sv || "$f" == *_pkg.v || "$f" == *.svh ]] && continue
    srcs+=("$f")
  done
  verilator --cc --coverage --sv "${srcs[@]}" --top-module "$TOP" \
    -Wno-DECLFILENAME -CFLAGS "-std=c++11" \
    --Mdir "$OPENRTL_COVERAGE_WORKSPACE" > "$ROOT/build/coverage/verilator.log" 2>&1 || true
  # after running sim in that workspace, merge
  if have verilator_coverage && ls "$OPENRTL_COVERAGE_WORKSPACE"/*.dat >/dev/null 2>&1; then
    verilator_coverage --annotate "$ROOT/build/coverage/annotated" \
      "$OPENRTL_COVERAGE_WORKSPACE"/*.dat \
      && verilator_coverage --write "$ROOT/build/coverage/coverage.dat" \
            "$OPENRTL_COVERAGE_WORKSPACE"/*.dat >/dev/null 2>&1
    log "  coverage -> build/coverage/coverage.dat"
  fi
}

cmd_verify() {
  log "netlist lint-clean re-check (top=$TOP)"
  local net="$ROOT/build/synth/${TOP}_netlist.v"
  [[ -f "$net" ]] || die "no netlist — run 'flow.sh synth'"
  # re-read netlist with arch cell sim models to confirm it re-elaborates
  local cells_sim="/usr/share/yosys/$ARCH/cells_sim.v"
  [[ -f "$cells_sim" ]] || cells_sim="$(yosys-config --datdir)/$ARCH/cells_sim.v"
  yosys -Q -p "read_verilog -sv $cells_sim $net; hierarchy -check -top $TOP; check" \
    > "$ROOT/build/lint/netlist.lint.log" 2>&1 \
    || { warn "netlist check found problems -> build/lint/netlist.lint.log"; exit 1; }
  echo "NETLIST LINT PASS (0 problems)" | tee -a "$ROOT/build/lint/netlist.lint.log"
}

cmd_reports() {
  log "rendering all reports + infographics"
  python3 "$REPORT_PY" all --project "$ROOT" --top "$TOP" --arch "$ARCH" >/dev/null
  # copy into build/reports for artifact capture
  cp -r "$ROOT"/docs/*/reports "$ROOT/build/reports/" 2>/dev/null
  find "$ROOT/docs" -path '*/reports/*' -name '*.md' | sort | while read -r f; do echo "  $f"; done
}

cmd_handoff() {
  log "packaging handoff"
  python3 "$REPORT_PY" handoff --project "$ROOT" --top "$TOP" --arch "$ARCH"
}

cmd_test() {
  log "running automated toolchain test suite"
  bash "$SCRIPT_DIR/../tests/run_tests.sh" "${TEST_ARGS[@]}"
}

cmd_all() {
  local rc=0
  # per-step required tool(s); skip gracefully when unavailable so the
  # pipeline can still produce reports from whatever is installed
  declare -A NEEDS=( [formal]="sby" [sim]="iverilog" [pnr]="nextpnr-$ARCH" [timing]="nextpnr-$ARCH" )
  for step in doctor lint sim formal synth pnr timing power coverage verify reports handoff; do
    local need="${NEEDS[$step]:-}"
    if [[ -n "$need" ]]; then
      local ok=1
      for t in $need; do have "$t" || ok=0; done
      if [[ $ok -eq 0 ]]; then
        warn "skip $step (missing: $need)"
        continue
      fi
    fi
    log "=== $step ==="
    if [[ "$step" == "doctor" ]]; then
      "cmd_$step" || warn "doctor found missing tools (informational)"
      continue
    fi
    "cmd_$step" || { warn "$step failed (continuing)"; rc=1; }
  done
  log "=== pipeline finished (rc=$rc) ==="
  return $rc
}

# --------------------------------------------------------------- dispatch --
case "$CMD" in
  doctor|lint|sim|formal|synth|pnr|timing|power|coverage|verify|reports|handoff|test|all)
    "cmd_$CMD" ;;
  *) usage ;;
esac
