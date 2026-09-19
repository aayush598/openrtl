# OpenRTL — Automation Layer

The automation layer turns the 36-phase OpenRTL workflow into runnable
software: one command drives every tool, every artifact is produced and
rendered into reports, and every tool is covered by automated tests.

```
packages/openrtl/
├── toolchain/            # installer, health check, unified flow driver
│   ├── manifest.yaml     #   machine-readable tool inventory (single source of truth)
│   ├── conda-env.yml     #   conda environment (yosys/iverilog/verilator + python stack)
│   ├── provision.sh      #   one-shot installer (conda-forge + pip + --source builds)
│   ├── doctor.sh         #   toolchain health check (PASS/FAIL/SKIP)
│   └── flow.sh           #   unified flow driver: lint → sim → formal → synth → pnr → …
├── report/               # zero-dependency report engine
│   ├── report.py         #   parsers, sections, quality scoring, handoff packaging
│   └── svg.py            #   dependency-free SVG infographics
├── scaffold/             # 36-phase project scaffold
│   └── scaffold.ts       #   generates docs/NN-phase, workflow.json, Makefile, …
├── tests/                # automated test suite (no manual testing required)
│   ├── run_tests.sh      #   per-tool suites with PASS/FAIL/SKIP reporting
│   └── test_report_engine.py   #  (fixture RTL is generated into a sandbox)
├── cicd/                 # CI wiring
│   ├── ci.sh             #   CI entry point used by workflows
│   └── openrtl-ci.yml    #   GitHub Actions workflow template
└── docs/                 # this documentation
```

## Quick start

```bash
# 1. install the toolchain (Linux/macOS/Windows-WSL2)
bash toolchain/provision.sh              # conda env + pip
bash toolchain/provision.sh --source     # icestorm, nextpnr, iverilog, SymbiYosys

# 2. verify everything installed
bash toolchain/doctor.sh

# 3. scaffold a project
bun scaffold/scaffold.ts --name myproject --desc "product idea" --top top --arch ice40 --dir ./out

# 4. run the full flow from the project root
cd out/myproject
bash /path/to/packages/openrtl/toolchain/flow.sh all

# 5. run the automated toolchain test suite
bash /path/to/packages/openrtl/toolchain/flow.sh test
```

## Guides

- [Setup: toolchain install, verify & test](toolchain.md) — prerequisites, `provision.sh`, `doctor.sh`, troubleshooting
- [flow.sh reference](flow.md) — every command, options, artifact layout
- [Report engine](report-engine.md) — sections, parsers, power model, quality scoring
- [Project scaffold](scaffold.md) — the 36 phases and generated files
- [Testing](testing.md) — the automated suite (fixtures generated at test time), CI gate
- [CI/CD](ci-cd.md) — `ci.sh` and the GitHub Actions template
