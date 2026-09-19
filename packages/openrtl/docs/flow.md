# flow.sh — unified flow driver

One command to run every tool, produce every artifact, and render every
report. No glue required.

```bash
bash flow.sh <command> [--top MODULE] [--arch ice40|ecp5|nexus|generic]
                       [--project DIR] [--threads N]
```

Run from the project root, or point at a project with `--project`. The top
module and architecture are auto-detected when not given (see below).

## Commands

| Command    | Tool              | What it does                                                     |
|------------|-------------------|------------------------------------------------------------------|
| `doctor`   | doctor.sh         | verify the toolchain (informational; missing tools are reported) |
| `lint`     | Verilator         | lint all RTL, `-Wall`, fail on `%Error`                          |
| `sim`      | cocotb + iverilog | run the regression (`make sim` or pytest)                        |
| `formal`   | SymbiYosys / sby  | prove formal properties under `formal/`                          |
| `synth`    | Yosys             | synthesize → netlist, JSON, stats, warnings, inference notes     |
| `pnr`      | nextpnr           | place & route → bitstream, timing, congestion reports            |
| `timing`   | nextpnr / icetime | timing analysis / STA                                            |
| `power`    | report engine     | toggle-based power estimate from netlist cell counts             |
| `coverage` | Verilator         | statement/toggle coverage → `build/coverage/coverage.dat`        |
| `verify`   | Yosys             | re-lint the synthesized netlist (netlist lint-clean check)       |
| `reports`  | report engine     | render every report + infographic into `docs/<phase>/reports/`   |
| `handoff`  | report engine     | package reports + netlist + bitstream into a zip                 |
| `test`     | test suite        | run `tests/run_tests.sh` (forward `--only/--verbose/--tap`)      |
| `all`      | —                 | full pipeline: doctor → lint → sim → formal → synth → pnr → timing → power → coverage → verify → reports |

## Top module & architecture detection

`--top` and `--arch` override auto-detection. Otherwise, in order:

1. `openrtl-project.json` (`top`, `arch`, `device`)
2. `docs/00-project/decisions/DECISION-070-fpga-arch.md` (architecture)
3. Makefile `--top-module` / `TOPLEVEL`
4. first `module` declared in `rtl/` (package files `*_pkg.*`, `*.svh` are
   sorted first so they are read before the modules that use them)

## Artifacts

Everything the workflow expects is written to predictable paths
(also declared in `manifest.yaml`):

| Artifact              | Path                                       |
|-----------------------|--------------------------------------------|
| Netlist               | `build/synth/<top>_netlist.v`              |
| Synth JSON (nextpnr)  | `build/synth/<top>_synth.json`             |
| Synth stat / log      | `build/synth/<top>_synth.stat|.log`        |
| Bitstream             | `build/pnr/<top>.bin`                      |
| ASC / config          | `build/pnr/<top>.asc|.config`              |
| P&R log               | `build/pnr/pnr.log`                        |
| Coverage data         | `build/coverage/coverage.dat`              |
| Reports               | `docs/<phase>/reports/*.md` + `*.svg`      |
| Handoff package       | `docs/34-release/handoff/<proj>-handoff-<date>.zip` |

## Error handling

- Missing tools are **skipped gracefully** (never crash mid-pipeline): in
  `all`, steps whose required tool is absent are reported as skipped so the
  pipeline still produces whatever reports it can.
- `all` returns non-zero if any present step failed; `doctor` failures are
  informational and don't abort the pipeline.
- Unknown options and commands print the usage header and exit 2.
