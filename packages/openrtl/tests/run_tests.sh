#!/usr/bin/env bash
# =============================================================================
# OpenRTL — run_tests.sh : automated toolchain test suite
# -----------------------------------------------------------------------------
# Verifies every open-source EDA tool in the toolchain with real test cases,
# so no manual testing is required. Each tool gets its own suite; results are
# reported as PASS / FAIL / SKIP with a non-zero exit code on any failure.
#
# Usage:
#   bash run_tests.sh                 # run every suite
#   bash run_tests.sh --list          # list available suites
#   bash run_tests.sh --only yosys    # run a single suite (repeatable)
#   bash run_tests.sh --verbose       # print tool output on failure
#   bash run_tests.sh --tap           # TAP output (CI-friendly)
#
# Tools are tested with a minimal RTL fixture that the suite generates into its
# sandbox (see gen_fixture below) — no design files ship in the repo. Missing
# tools are SKIPped (not failed), so the suite passes on a minimal machine and
# covers everything on a provisioned one.
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENRTL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FLOW="$OPENRTL_DIR/toolchain/flow.sh"
REPORT="$OPENRTL_DIR/report/report.py"
WORK="$(mktemp -d)"
cd "$WORK"   # sandbox: tool runs (yosys etc.) never pollute the caller's CWD
trap 'rm -rf "$WORK"' EXIT
FIXTURE="$WORK/fixture"

# ---------------------------------------------------------------- options --
ONLY=()
VERBOSE=0
TAP=0
LIST=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --list) LIST=1; shift ;;
    --only) ONLY+=("$2"); shift 2 ;;
    --verbose) VERBOSE=1; shift ;;
    --tap) TAP=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

# ------------------------------------------------------------ results ------
PASS=0; FAIL=0; SKIP=0
declare -a FAILED_SUITES=()

report() { # report <RESULT> <suite> <detail>
  local res="$1" name="$2" detail="${3:-}"
  case "$res" in
    PASS) PASS=$((PASS+1)) ;;
    FAIL) FAIL=$((FAIL+1)); FAILED_SUITES+=("$name") ;;
    SKIP) SKIP=$((SKIP+1)) ;;
  esac
  if [[ $TAP -eq 1 ]]; then
    printf "  %-4s %s\n" "$res" "$name"
    [[ -n "$detail" ]] && printf "       # %s\n" "$detail"
  else
    local color
    case "$res" in PASS) color="\033[1;32m" ;; FAIL) color="\033[1;31m" ;; SKIP) color="\033[1;33m" ;; esac
    printf "${color}  %-4s\033[0m %-24s %s\n" "$res" "$name" "$detail"
  fi
}

# ------------------------------------------------------------------ utils --
have() { command -v "$1" >/dev/null 2>&1; }
assert_contains() { # assert_contains <haystack> <needle> <msg>
  if grep -q -- "$2" <<< "$1"; then return 0; fi
  return 1
}
assert_exists() { [[ -e "$1" ]]; }
check() { # check <name> <msg> ; runs a command; returns 0 on success
  local name="$1" msg="$2"; shift 2
  local out
  if out="$("$@" 2>&1)"; then
    report PASS "$name" "$msg"
    [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$out" | sed 's/^/    /'
    return 0
  fi
  report FAIL "$name" "$msg"
  [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$out" | sed 's/^/    /'
  return 1
}
need() { have "$1" || { report SKIP "$2" "not installed: $1"; return 1; }; return 0; }

# ------------------------------------------------------------------ fixture --
# Generate the minimal RTL test fixture into $WORK/fixture. Kept out of the
# repo on purpose: it is test data for the software, not a user project, and
# generating it at test time keeps the package free of design files.
gen_fixture() {
  mkdir -p "$FIXTURE/rtl" "$FIXTURE/formal" "$FIXTURE/constraints" "$FIXTURE/tb"

  cat > "$FIXTURE/rtl/addsub.sv" <<'EOF'
// OpenRTL test fixture (generated at test time) - addsub.sv
// Combinational 4-bit add/subtract unit with a 5-bit result. Exercises the
// SystemVerilog front-ends (yosys -sv, verilator --sv) and formal checking.
module addsub (
  input  logic [3:0] a,   // operand A
  input  logic [3:0] b,   // operand B
  input  logic       sub, // 0 = add, 1 = subtract
  output logic [4:0] y    // result (5-bit to hold carry/borrow)
);

  assign y = sub ? ({1'b0, a} - {1'b0, b}) : ({1'b0, a} + {1'b0, b});

endmodule
EOF

  cat > "$FIXTURE/rtl/counter.v" <<'EOF'
// OpenRTL test fixture (generated at test time) - counter.v
// Synchronous 8-bit counter with active-low async reset and clock enable.
// Verilog-2001 so every simulator in the toolchain accepts it unchanged.
module counter #(
  parameter WIDTH = 8
) (
  input  wire             clk,    // system clock
  input  wire             rst_n,  // active-low async reset
  input  wire             en,     // clock enable
  output reg  [WIDTH-1:0] count   // running count
);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n)
      count <= {WIDTH{1'b0}};
    else if (en)
      count <= count + 1'b1;
  end

endmodule
EOF

  cat > "$FIXTURE/formal/addsub_property.sv" <<'EOF'
// OpenRTL test fixture (generated at test time) - formal/addsub_property.sv
// Reference-model property file for SymbiYosys. Instantiates the DUV and
// asserts the expected arithmetic. Inline assertions only: yosys does not
// parse named `property ... endproperty` blocks or the |-> operator.
module addsub_property (
  input  logic [3:0] a,
  input  logic [3:0] b,
  input  logic       sub,
  output logic [4:0] y
);

  addsub u_duv (.a(a), .b(b), .sub(sub), .y(y));

  // !sub => y == a + b
  assert property (sub || (y == ({1'b0, a} + {1'b0, b})));
  //  sub => y == a - b
  assert property (!sub || (y == ({1'b0, a} - {1'b0, b})));

endmodule
EOF

  cat > "$FIXTURE/formal/addsub.sby" <<'EOF'
# OpenRTL test fixture (generated at test time) - formal/addsub.sby
# SymbiYosys copies each [files] entry into its src/ directory (flattened),
# so the [script] reads use the basenames, not the original paths.
[options]
mode prove
expect pass

[engines]
smtbmc z3

[script]
read_verilog -sv addsub.sv
read_verilog -sv addsub_property.sv
prep -top addsub_property

[files]
rtl/addsub.sv
formal/addsub_property.sv
EOF

  cat > "$FIXTURE/constraints/up5k.pcf" <<'EOF'
# OpenRTL test fixture (generated at test time) - up5k.pcf
# Pins validated against the nextpnr iCE40UP5K sg48 chipdb (SPI/config pins
# such as 35/36/46 are excluded and must not be used as user IO).
set_io clk 44
set_io rst_n 2
set_io en 3
set_io count[0] 45
set_io count[1] 47
set_io count[2] 48
set_io count[3] 34
set_io count[4] 37
set_io count[5] 39
set_io count[6] 41
set_io count[7] 7
EOF

  cat > "$FIXTURE/constraints/counter.sdc" <<'EOF'
# OpenRTL test fixture (generated at test time) - counter.sdc
# 50 MHz target clock on the counter design.
create_clock -name clk -period 20.000 -waveform {0 10.000} [get_ports clk]
EOF

  cat > "$FIXTURE/openrtl-project.json" <<'EOF'
{
  "name": "simple",
  "description": "OpenRTL automated test fixture: 8-bit counter (sequential) + 4-bit add/sub (combinational).",
  "top": "counter",
  "arch": "ice40",
  "device": "ice40up5k-sg48",
  "schema": "openrtl/project-schema@1",
  "lifecycle": { "phases": 36, "groups": ["define", "design", "implement", "verify", "produce", "sustain"] },
  "toolchain": "packages/openrtl/toolchain/manifest.yaml",
  "tags": ["test-fixture"],
  "updatedAt": "2026-01-01T00:00:00Z"
}
EOF

  cat > "$FIXTURE/Makefile" <<'EOF'
# OpenRTL test fixture (generated at test time) - Makefile
.PHONY: sim clean
sim:
	$(MAKE) -C tb -f Makefile.cocotb TOPLEVEL=counter MODULE=test_counter \
		VERILOG_SOURCES=../rtl/counter.v

clean:
	rm -rf tb/sim_build tb/results.xml tb/__pycache__
EOF

  cat > "$FIXTURE/tb/Makefile.cocotb" <<'EOF'
# OpenRTL test fixture (generated at test time) - tb/Makefile.cocotb
SIM            ?= icarus
TOPLEVEL_LANG  ?= verilog
TOPLEVEL       ?= counter
MODULE         ?= test_counter
VERILOG_SOURCES?= ../rtl/counter.v
COCOTB_CONFIG  ?= $(shell cocotb-config --makefiles)

include $(COCOTB_CONFIG)/Makefile.sim
EOF

  cat > "$FIXTURE/tb/test_counter.py" <<'EOF'
# OpenRTL test fixture (generated at test time) - tb/test_counter.py
# cocotb tests for the 8-bit counter: reset, enable gating, increment behavior.
# The fixture is pure RTL (counter.v) with no testbench clock, so each test
# starts a cocotb Clock to keep the simulator running while awaiting edges.
import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def apply_reset(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    dut.rst_n.value = 0
    dut.en.value = 0
    dut.count.value = 0
    await Timer(2, units="ns")
    dut.rst_n.value = 1
    await RisingEdge(dut.clk)


@cocotb.test()
async def test_reset(dut):
    """After reset, count is zero and stays zero while en=0."""
    await apply_reset(dut)
    await RisingEdge(dut.clk)
    assert int(dut.count.value) == 0, f"count={dut.count.value}"
    await RisingEdge(dut.clk)
    assert int(dut.count.value) == 0, f"count={dut.count.value}"


@cocotb.test()
async def test_count_up(dut):
    """With en=1, count increments by one each clock edge."""
    await apply_reset(dut)
    dut.en.value = 1
    for expected in range(1, 6):
        await RisingEdge(dut.clk)
        await Timer(1, units="ns")
        assert int(dut.count.value) == expected, (
            f"cycle {expected}: count={dut.count.value}"
        )


@cocotb.test()
async def test_enable_gating(dut):
    """With en=0, count holds its value across clock edges."""
    await apply_reset(dut)
    dut.en.value = 1
    await RisingEdge(dut.clk)
    await Timer(1, units="ns")
    held = int(dut.count.value)
    dut.en.value = 0
    for _ in range(3):
        await RisingEdge(dut.clk)
        await Timer(1, units="ns")
        assert int(dut.count.value) == held, (
            f"count moved to {dut.count.value} while disabled"
        )


@cocotb.test()
async def test_async_reset(dut):
    """Async reset takes effect immediately, without waiting for a clock edge."""
    await apply_reset(dut)
    dut.en.value = 1
    for _ in range(3):
        await RisingEdge(dut.clk)
    await Timer(1, units="ns")
    assert int(dut.count.value) == 3, f"count={dut.count.value}"
    dut.rst_n.value = 0
    await Timer(1, units="ns")
    assert int(dut.count.value) == 0, f"count={dut.count.value}"
EOF
}

# ===========================================================================
# suites
# ===========================================================================

# ------------------------------------------------------------- yosys -------
suite_yosys() {
  need yosys yosys || return
  local out="$WORK/yosys"
  mkdir -p "$out"
  check "yosys/synthesis" "synthesize addsub.sv" bash -c "
    yosys -Q -p 'read_verilog -sv $FIXTURE/rtl/addsub.sv; hierarchy -check -top addsub; synth_ice40 -top addsub' \
      > '$out/addsub.log' 2>&1" || return
  local log; log="$(cat "$out/addsub.log")"
  if assert_contains "$log" "SB_CARRY"; then
    report PASS "yosys/arch-mapping" "SB_CARRY inferred for addsub"
  else
    report FAIL "yosys/arch-mapping" "no SB_CARRY found"
    [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$log" | sed 's/^/    /'
  fi
  # netlist write + verify re-read
  bash -c "
    yosys -Q -p 'read_verilog -sv $FIXTURE/rtl/addsub.sv; hierarchy -top addsub; synth_ice40 -top addsub;
                 write_verilog $out/addsub_net.v; read_verilog $out/addsub_net.v; hierarchy -check -top addsub; check' \
      > '$out/net.log' 2>&1"
  if assert_exists "$out/addsub_net.v" && grep -q '0 problems' "$out/net.log"; then
    report PASS "yosys/netlist-clean" "netlist re-reads with 0 problems"
  else
    report FAIL "yosys/netlist-clean" "netlist verify failed"
    [[ $VERBOSE -eq 1 ]] && cat "$out/net.log" | sed 's/^/    /'
  fi
}

# ---------------------------------------------------------- verilator ------
suite_verilator() {
  need verilator verilator || return
  local out="$WORK/vlt"
  mkdir -p "$out"
  verilator --lint-only --sv -Wall -Wno-DECLFILENAME \
    "$FIXTURE/rtl/counter.v" "$FIXTURE/rtl/addsub.sv" --top-module counter \
    > "$out/lint.log" 2>&1 || true
  if grep -q '%Error' "$out/lint.log" 2>/dev/null; then
    report FAIL "verilator/lint" "lint reported errors"
    [[ $VERBOSE -eq 1 ]] && cat "$out/lint.log" | sed 's/^/    /'
  else
    report PASS "verilator/lint" "lint clean"
  fi
  # coverage dat merge sanity (only if verilator_coverage present)
  if have verilator_coverage; then
    printf 'C\t/simple/counter.v\t3\t1\t0\t0\n' > "$out/c1.dat"
    printf 'C\t/simple/counter.v\t4\t0\t0\t0\n' > "$out/c2.dat"
    if verilator_coverage --write "$out/merged.dat" "$out"/*.dat >/dev/null 2>&1 \
       && [[ -s "$out/merged.dat" ]]; then
      report PASS "verilator/coverage" "coverage merge produces .dat"
    else
      report FAIL "verilator/coverage" "verilator_coverage merge failed"
    fi
  fi
}

# ------------------------------------------------------- iverilog ----------
suite_iverilog() {
  need iverilog iverilog || return
  local out="$WORK/iverilog"
  mkdir -p "$out"
  check "iverilog/compile" "compile counter.v" bash -c "
    iverilog -g2012 -o '$out/sim.vvp' '$FIXTURE/rtl/counter.v'" || return
  # minimal self-checking testbench
  cat > "$out/tb.v" <<'EOF'
`timescale 1ns/1ps
module tb;
  reg clk=0, rst_n=0, en=0;
  wire [7:0] count;
  counter #(.WIDTH(8)) dut (.clk(clk), .rst_n(rst_n), .en(en), .count(count));
  always #5 clk = ~clk;
  integer errors = 0;
  initial begin
    #20 rst_n = 1;
    #10 en = 1;
    // 5 cycles of counting (#1 after posedge lets the NBA commit)
    repeat (5) begin @(posedge clk); #1; end
    if (count !== 8'h05) begin $display("FAIL count=%h", count); errors = 1; end
    else $display("OK count=5");
    en = 0;
    @(posedge clk); #1;
    if (count !== 8'h05) begin $display("FAIL hold=%h", count); errors = 1; end
    else $display("OK hold");
    $finish;
  end
endmodule
EOF
  check "iverilog/compile-tb" "compile testbench" bash -c "
    iverilog -g2012 -o '$out/sim.vvp' '$FIXTURE/rtl/counter.v' '$out/tb.v'" || return
  local simlog
  simlog="$(vvp "$out/sim.vvp" 2>&1 || true)"
  if ! grep -q "FAIL" <<< "$simlog" && grep -q "OK" <<< "$simlog"; then
    report PASS "iverilog/sim" "counter increments + holds correctly"
  else
    report FAIL "iverilog/sim" "simulation failed"
    [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$simlog" | sed 's/^/    /'
  fi
}

# ------------------------------------------------------------ nextpnr ------
suite_nextpnr() {
  need nextpnr-ice40 nextpnr-ice40 || return
  local out="$WORK/pnr"
  mkdir -p "$out"
  # synthesize the counter first (need a JSON for nextpnr)
  check "nextpnr/prep" "synthesize counter to JSON" bash -c "
    yosys -Q -p 'read_verilog -sv $FIXTURE/rtl/counter.v; hierarchy -top counter;
                 synth_ice40 -top counter; write_json $out/counter.json' > '$out/synth.log' 2>&1" || return
  check "nextpnr/pnr" "place & route counter on up5k" bash -c "
    nextpnr-ice40 --json '$out/counter.json' --pcf '$FIXTURE/constraints/up5k.pcf' \
      --asc '$out/counter.asc' --freq 50 > '$out/pnr.log' 2>&1" || true
  local plog; plog="$(cat "$out/pnr.log" 2>/dev/null || true)"
  if grep -qE "Routed successfully|Program finished normally" <<< "$plog"; then
    report PASS "nextpnr/routed" "routed successfully"
  else
    report FAIL "nextpnr/routed" "P&R did not converge"
    [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$plog" | sed 's/^/    /'
  fi
  if grep -q "Max frequency" <<< "$plog"; then
    report PASS "nextpnr/fmax" "timing reported"
  else
    report SKIP "nextpnr/fmax" "no frequency report (unconstrained)"
  fi
  if have icepack; then
    if icepack "$out/counter.asc" "$out/counter.bin" >/dev/null 2>&1 && [[ -s "$out/counter.bin" ]]; then
      report PASS "nextpnr/bitstream" "icepack produced .bin"
    else
      report FAIL "nextpnr/bitstream" "icepack failed"
    fi
  else
    report SKIP "nextpnr/bitstream" "icepack not installed"
  fi
}

# ------------------------------------------------------------ icetime -------
suite_icetime() {
  need icetime icetime || return
  local out="$WORK/icetime"
  mkdir -p "$out"
  check "icetime/prep" "synthesize + P&R counter" bash -c "
    yosys -Q -p 'read_verilog -sv $FIXTURE/rtl/counter.v; hierarchy -top counter;
                 synth_ice40 -top counter; write_json $out/counter.json' >/dev/null 2>&1 &&
    nextpnr-ice40 --json '$out/counter.json' --pcf '$FIXTURE/constraints/up5k.pcf' \
      --asc '$out/counter.asc' --freq 50 >/dev/null 2>&1" || return
  check "icetime/sta" "static timing on placed design" bash -c "
    icetime -d up5k -c 50 -t '$out/counter.asc' > '$out/timing.rpt' 2>&1" || true
  local trpt; trpt="$(cat "$out/timing.rpt" 2>/dev/null || true)"
  if grep -q "Total path delay" <<< "$trpt"; then
    local fmax; fmax="$(grep -oP '\(\K[0-9.]+(?= MHz)' <<< "$trpt" | head -1)"
    report PASS "icetime/fmax" "Fmax measured: ${fmax} MHz"
  else
    report FAIL "icetime/fmax" "no Fmax in timing report"
    [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$trpt" | sed 's/^/    /'
  fi
}

# ------------------------------------------------------------ cocotb -------
suite_cocotb() {
  need iverilog iverilog || return
  if ! python3 -c 'import cocotb' >/dev/null 2>&1; then
    report SKIP cocotb "cocotb not importable"
    return
  fi
  local out="$WORK/cocotb"
  mkdir -p "$out"
  cp -r "$FIXTURE" "$out/design"
  if [[ ! -f "$out/design/tb/Makefile.cocotb" ]]; then report FAIL cocotb "missing Makefile.cocotb"; return; fi
  local log
  log="$(cd "$out/design" && make sim 2>&1)"
  local rc=$?
  [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$log" | sed 's/^/    /'
  if [[ $rc -ne 0 ]]; then report FAIL cocotb "cocotb run failed"; return; fi
  # cocotb records results in tb/results.xml (summary lines do not say
  # "N tests passed"), so count <testcase> elements and look for failures.
  local xml="$out/design/tb/results.xml"
  if ! [[ -f "$xml" ]]; then report FAIL cocotb "no results.xml"; return; fi
  if grep -qE '<failure|<error' "$xml"; then
    report FAIL cocotb "failing tests in results.xml"
    return
  fi
  local passed
  passed="$(grep -c '<testcase ' "$xml" || echo 0)"
  if [[ "$passed" -ge 1 ]]; then
    report PASS cocotb "$passed tests passed"
  else
    report FAIL cocotb "no tests recorded"
  fi
}

# ------------------------------------------------------------ sby ----------
suite_sby() {
  need sby sby || return
  local out="$WORK/sby"
  mkdir -p "$out"
  cp -r "$FIXTURE" "$out/design"
  local log
  log="$(cd "$out/design" && sby -f formal/addsub.sby 2>&1)"
  local rc=$?
  [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$log" | sed 's/^/    /'
  if [[ $rc -eq 0 ]] && grep -qE "PASS" <<< "$log"; then
    report PASS sby "addsub properties proven"
  else
    report FAIL sby "formal proof failed"
  fi
}

# ------------------------------------------------- report engine (python) --
suite_report() {
  need python3 report-engine || return
  local out="$WORK/report"
  mkdir -p "$out"
  check "report/unit" "report engine unit tests" bash -c "
    python3 '$SCRIPT_DIR/test_report_engine.py'" || true
}

# ------------------------------------------------------------ flow.sh ------
suite_flow() {
  need yosys flow.sh || return
  local proj="$WORK/flowproj"
  cp -r "$FIXTURE" "$proj"
  local log
  log="$(cd "$proj" && bash "$FLOW" synth --top counter --arch ice40 2>&1)"
  local rc=$?
  [[ $VERBOSE -eq 1 ]] && printf '%s\n' "$log" | sed 's/^/    /'
  if [[ $rc -eq 0 && -f "$proj/build/synth/counter_netlist.v" ]]; then
    report PASS "flow/synth" "netlist produced via flow.sh"
  else
    report FAIL "flow/synth" "flow.sh synth failed (rc=$rc)"
    return
  fi
  # verify step
  log="$(cd "$proj" && bash "$FLOW" verify --top counter 2>&1)"
  if echo "$log" | grep -q "NETLIST LINT PASS"; then
    report PASS "flow/verify" "netlist lint-clean re-check"
  else
    report FAIL "flow/verify" "netlist verify failed"
  fi
  # power report
  log="$(cd "$proj" && bash "$FLOW" power --top counter 2>&1)"
  if echo "$log" | grep -q "Estimated total"; then
    report PASS "flow/power" "power estimate generated"
  else
    report FAIL "flow/power" "no power estimate"
  fi
  # reports + handoff
  (cd "$proj" && bash "$FLOW" reports --top counter >/dev/null 2>&1)
  (cd "$proj" && bash "$FLOW" handoff --top counter >/dev/null 2>&1)
  if ls "$proj"/docs/*/reports/synth.md >/dev/null 2>&1; then
    report PASS "flow/reports" "report engine rendered synth.md"
  else
    report FAIL "flow/reports" "no reports rendered"
  fi
  if ls "$proj"/docs/34-release/handoff/*.zip >/dev/null 2>&1; then
    report PASS "flow/handoff" "handoff package created"
  else
    report FAIL "flow/handoff" "no handoff zip"
  fi
}

# ------------------------------------------------------------ scaffold -----
suite_scaffold() {
  need bun scaffold || return
  local out="$WORK/scaff"
  mkdir -p "$out"
  if ! bun "$OPENRTL_DIR/scaffold/scaffold.ts" --name demo --desc "test" --top counter \
       --arch ice40 --dir "$out" > "$out/scaff.log" 2>&1; then
    report FAIL scaffold "scaffold failed"
    return
  fi
  local root="$out/demo"
  local count_phases
  count_phases="$(ls -d "$root"/docs/[0-9][0-9]-* 2>/dev/null | wc -l)"
  if [[ "$count_phases" == "36" ]] && [[ -f "$root/openrtl-project.json" ]] && [[ -f "$root/docs/workflow/workflow.json" ]]; then
    report PASS scaffold "36 phases generated"
  else
    report FAIL scaffold "expected 36 phases, got $count_phases"
  fi
}

# ===========================================================================
# run
# ===========================================================================
ALL_SUITES=(yosys verilator iverilog nextpnr icetime cocotb sby report flow scaffold)

if [[ $LIST -eq 1 ]]; then
  printf '%s\n' "${ALL_SUITES[@]}"
  exit 0
fi

echo "OpenRTL toolchain test suite"
gen_fixture
echo "fixture: $FIXTURE"
echo "------------------------------------------------------"

RUN=()
if [[ ${#ONLY[@]} -gt 0 ]]; then
  for s in "${ONLY[@]}"; do RUN+=("$s"); done
else
  RUN=("${ALL_SUITES[@]}")
fi

for suite in "${RUN[@]}"; do
  if [[ " ${ALL_SUITES[*]} " != *" $suite "* ]]; then
    echo "  unknown suite: $suite (use --list)" >&2
    continue
  fi
  echo "[ $suite ]"
  "suite_$suite"
done

echo "------------------------------------------------------"
echo "  PASS=$PASS FAIL=$FAIL SKIP=$SKIP"
if [[ ${#FAILED_SUITES[@]} -gt 0 ]]; then
  echo "  failed: ${FAILED_SUITES[*]}"
  exit 1
fi
exit 0
