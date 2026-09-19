# Testing

Every tool in the toolchain is covered by automated test cases, so no manual
testing is required. The suite is built around a self-contained fixture design
and per-tool suites with `PASS` / `FAIL` / `SKIP` reporting.

```bash
bash tests/run_tests.sh                      # run every suite
bash tests/run_tests.sh --list               # list available suites
bash tests/run_tests.sh --only yosys         # run a single suite
bash tests/run_tests.sh --only verilator --only report
bash tests/run_tests.sh --verbose            # print tool output on failure
bash tests/run_tests.sh --tap                # TAP output (CI-friendly)
```

Or via the flow driver:

```bash
bash toolchain/flow.sh test                  # same as run_tests.sh
bash toolchain/flow.sh test --only report    # pass-through flags
```

Exit code is non-zero if any suite failed; skipped tools (not installed) are
reported but never fail the run.

## Fixtures

No design files live in the repository. `run_tests.sh` generates a minimal
RTL fixture into its temp sandbox (`gen_fixture` in `tests/run_tests.sh`)
each time it runs:

- `rtl/counter.v` — 8-bit synchronous counter (Verilog-2001, parameterized)
- `rtl/addsub.sv` — 4-bit add/sub unit (SystemVerilog)
- `formal/addsub_property.sv` + `formal/addsub.sby` — SVA properties (smtbmc)
- `tb/Makefile.cocotb` + `tb/test_counter.py` — cocotb regression (4 tests)
- `constraints/counter.sdc` (50 MHz) + `constraints/up5k.pcf` (iCEBreaker pins)
- `openrtl-project.json` — `top: counter`, `arch: ice40`, `device: ice40up5k-sg48`

The design intentionally mixes Verilog and SystemVerilog, sequential and
combinational logic, so every front-end gets real input.

## Suites → tools

| Suite     | Tools           | Verifies                                            |
|-----------|-----------------|-----------------------------------------------------|
| `yosys`   | yosys           | SV synthesis, `SB_CARRY` inference, netlist re-read |
| `verilator`| verilator      | lint clean, coverage merge                          |
| `iverilog`| iverilog, vvp   | compile + self-checking simulation (count + hold)   |
| `nextpnr` | nextpnr-ice40, icepack | P&R convergence, fmax, bitstream             |
| `icetime` | icetime         | static timing on the placed/routed design           |
| `cocotb`  | cocotb + iverilog | full cocotb regression (4 tests)                  |
| `sby`     | symbiyosys      | formal proof of the addsub properties               |
| `report`  | python3         | report engine unit tests (`test_report_engine.py`)  |
| `flow`    | flow.sh         | synth → verify → power → reports → handoff pipeline |
| `scaffold`| bun             | scaffold generates 36 phases + manifest + workflow  |

## Report engine unit tests

`tests/test_report_engine.py` covers the parsers against realistic tool
output, the power-model math, SVG validity for every chart kind, quality
scoring, and markdown helpers. It runs standalone (`python3`) or under
pytest; both paths pass.

## CI gate

The full suite is the CI gate. On a provisioned image every suite must pass;
on a minimal image the not-installed tools report `SKIP` and the suite still
passes as long as nothing `FAIL`s. See [CI/CD](ci-cd.md).
