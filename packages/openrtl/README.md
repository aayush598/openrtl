# OpenRTL

36-phase FPGA/IC product workflow with a **fully open-source EDA toolchain**,
a **one-click flow driver**, **automated reporting with infographics**, and an
**automated test suite** — so no manual testing is required.

## What's here

| Path | Purpose |
| --- | --- |
| `toolchain/manifest.yaml` | machine-readable tool → phase inventory |
| `toolchain/conda-env.yml` | reproducible toolchain env (conda + pip) |
| `toolchain/provision.sh` | one-shot installer (conda/pip/apt) |
| `toolchain/doctor.sh` | health check: versions + PASS/FAIL per tool |
| `toolchain/flow.sh` | unified flow driver (lint/sim/formal/synth/pnr/timing/power/coverage/verify/reports/handoff/test/all) |
| `report/svg.py` | dependency-free SVG chart library |
| `report/report.py` | report engine: parses tool outputs → Markdown + SVGs + handoff zip |
| `scaffold/scaffold.ts` | generate a complete 36-phase project tree from a description |
| `tests/` | automated toolchain test suite (`run_tests.sh` + report unit tests + fixture) |
| `cicd/` | CI entry point (`ci.sh`) + GitHub Actions workflow template |
| `docs/` | full documentation (toolchain, flow, report engine, scaffold, testing, CI) |

## Setup

> Commands below are relative to this directory (`packages/openrtl/`). From a
> scaffolded project you can also run the flow via its generated `Makefile`.

### Prerequisites

- **Linux, macOS or Windows (WSL2)**
- **conda** or **mamba** (for the EDA tools) — or an existing `python3 >= 3.9`
  with pip for a minimal install
- **Bun** (only needed to run the scaffold generator)

### 1. Install the toolchain

One command installs Yosys, Icarus Verilog, Verilator, cocotb and pytest from
conda-forge + pip, then builds the FPGA place-and-route stack (icestorm,
nextpnr-ice40) and SymbiYosys from source (conda-forge doesn't ship those):

```bash
bash toolchain/provision.sh               # conda env + pip
bash toolchain/provision.sh --source      # icestorm, nextpnr, iverilog, SymbiYosys
```

Use `bash toolchain/provision.sh --check` to see what's missing without
installing, `bash toolchain/provision.sh --pip` for the Python-side tools
only, or `bash toolchain/provision.sh --source` alone when yosys/verilator
are already installed via your OS package manager.

### 2. Verify the installation

```bash
bash toolchain/doctor.sh
```

Prints each tool with its version and a `PASS` / `FAIL` / `SKIP` verdict.
The exit code is non-zero if any required tool is missing — usable as a CI gate.

### 3. Run the automated test suite

Every tool is covered by automated tests, so no manual testing is required:

```bash
bash tests/run_tests.sh                      # all suites (PASS/FAIL/SKIP)
bash toolchain/flow.sh test                  # same, via the flow driver
bash toolchain/flow.sh test --only yosys     # one suite
```

Tools that aren't installed report `SKIP`; any real failure is a non-zero exit.

### 4. Create and drive a project

```bash
# scaffold a 36-phase project (requires bun)
bun scaffold/scaffold.ts \
    --name myproject --desc "your product idea" --top top --arch ice40

# run the full pipeline from the project root
cd myproject
make all        # or: bash <repo>/packages/openrtl/toolchain/flow.sh all
```

## One-click flow

`flow.sh all` runs: doctor → lint → sim → formal → synth → pnr → timing →
power → coverage → verify → reports → handoff. Every tool produces the
artifacts the workflow expects, and the report engine renders each phase's
deliverables automatically. Missing tools are skipped gracefully, so the
pipeline still produces whatever reports it can.

## Reports

`report.py` parses real tool output (yosys logs/stats, nextpnr logs,
SDC constraints, pytest results, netlist JSON) and writes:

- `docs/<phase>/reports/<section>.md` — publishable Markdown
- `docs/<phase>/reports/*.svg` — dependency-free infographics
- `docs/34-release/handoff/*.zip` — netlist + bitstream + reports package

### Sections

`synth` (netlist, resource analysis, device budget, inference analysis,
warnings, constraints, optimization, quality assessment) · `pnr` · `timing` ·
`power` · `coverage` · `formal` · `sim` · `quality` · `all`

## Testing

The suites generate a minimal RTL fixture (counter + add/sub) into a temp
sandbox at test time and drive it through yosys, verilator, iverilog,
nextpnr, icetime, cocotb, SymbiYosys, the report engine, the flow pipeline
and the scaffold. No design files ship in the repository. Run with:

```bash
bash tests/run_tests.sh              # every suite
bash toolchain/flow.sh test          # via the flow driver
bash cicd/ci.sh --skip-install       # CI entry point (doctor + suite)
```

## Scaffolding a project

```bash
bun scaffold/scaffold.ts --name alu4 --desc "4-bit ALU with add, sub, logic ops, shift" \
    --top alu4 --arch ice40
```

Creates all 36 phase directories with status trackers, quality gates, context
files, workflow.json, and a Makefile wired to `flow.sh`.

## Documentation

See [`docs/`](docs/README.md) for the full guides: toolchain, flow.sh
reference, report engine, scaffold, testing, and CI/CD.
