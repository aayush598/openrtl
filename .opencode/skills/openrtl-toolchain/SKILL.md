---
name: openrtl-toolchain
description: Operate the OpenRTL toolchain (open-source by default, commercial tools via adapters). Use to run synthesis, simulation, formal, timing, P&R, and firmware tooling through the unified flow driver. Load before running any EDA tool.
---

# OpenRTL — Toolchain

## Uniform interface
- **Automated driver:** `packages/openrtl/toolchain/flow.sh <command>`
- **Install:** `bash packages/openrtl/toolchain/provision.sh` (conda/pip/apt)
- **Health check:** `bash packages/openrtl/toolchain/doctor.sh`
- **Test suite:** `bash packages/openrtl/toolchain/flow.sh test` (or `tests/run_tests.sh`)
- **Reports:** `python3 packages/openrtl/report/report.py <section> --project .`
- **Manifest:** `packages/openrtl/toolchain/manifest.yaml` (tool → phase mapping)
- **Conda env:** `packages/openrtl/toolchain/conda-env.yml`
- **Docs:** `packages/openrtl/docs/`

## flow.sh commands
| Command | Tool | Artifacts |
| --- | --- | --- |
| `lint` | verilator | `build/lint/lint.log` |
| `sim` | cocotb + iverilog/pytest | `build/sim/sim.log` |
| `formal` | symbiyosys / yosys sat | `build/formal/*.log` |
| `synth` | yosys | `build/synth/<top>_netlist.v`, `_synth.json`, `_synth.stat`, `_synth.log` |
| `pnr` | nextpnr-<arch> + icepack | `build/pnr/<top>.asc`, `.bin`, `pnr.log` |
| `timing` | nextpnr STA / icetime | `build/timing/timing.rpt` |
| `power` | report engine (netlist toggle model) | `build/power/power.md` |
| `coverage` | verilator | `build/coverage/coverage.dat` |
| `verify` | yosys re-read + check | `build/lint/netlist.lint.log` |
| `reports` | report engine | `docs/<phase>/reports/*.md` + `*.svg` |
| `handoff` | report engine | `docs/34-release/handoff/<project>-handoff-<date>.zip` |
| `test` | automated suite | `tests/run_tests.sh` (PASS/FAIL/SKIP per tool) |
| `all` | full pipeline | everything above |

## Open-source (default)
yosys, nextpnr, icestorm, verilator, iverilog, symbiyosys, cocotb, opensta, openocd, renode, qemu, kicad, ngspice.

## Commercial (optional adapters)
vivado, quartus, libero — enabled only when `OPENRTL_VENDOR_TOOLS=1` and the tool is installed.

## Rules
- **Prefer the flow driver.** Run `flow.sh <cmd>` rather than invoking tools by hand, so artifacts land where the workflow and report engine expect them.
- Run `flow.sh doctor` after provisioning or moving machines.
- After changing any tool integration or parser, run `flow.sh test` and leave the suite green.
- Prefer open-source flows; use vendor adapters only when required and available.
- Record tool versions in the phase toolchain context (from `flow.sh doctor` output).
