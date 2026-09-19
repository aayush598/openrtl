# Project scaffold

Generates a complete, workflow-conformant project skeleton — 36 phase
directories with their gates and context, plus the project manifest,
workflow JSON and a Makefile wired to `flow.sh`.

```bash
bun scaffold/scaffold.ts --name <name> --desc "<product description>"
    [--top MODULE] [--arch ice40|ecp5|nexus|generic] [--device PART] [--dir DIR]
```

Run from `packages/openrtl/scaffold/` (or with a path to the file). Defaults:
`--name project`, `--arch ice40`, `--dir .`.

## What it generates

```
<name>/
├── openrtl-project.json        # manifest: name, desc, top, arch, device, lifecycle
├── Makefile                    # targets lint/synth/pnr/timing/.../all → flow.sh
├── docs/
│   ├── NN-phase/               # 36 numbered phase directories
│   │   ├── status.md           # phase status (incomplete/in-progress/complete)
│   │   ├── gates.md            # entry/exit gates for the phase
│   │   └── ctx/*.md            # phase context notes
│   └── workflow/workflow.json  # machine-readable 36-phase workflow
├── rtl/                        # placeholder for RTL sources
├── constraints/                # SDC + PCF live here
├── formal/                     # SVA properties + .sby configs
├── tb/                         # cocotb testbenches
└── build/                      # tool artifacts (synth/pnr/sim/coverage/…)
```

## The 36 phases

Phases are numbered `00`–`35` and grouped into six lifecycle groups:

| Group | Phases | Focus |
|-------|--------|-------|
| `define` | 00–04 | Project, Ideation, Market, Requirements, Feasibility |
| `design` | 05–19 | System Architecture → Interface, FPGA/Component selection, Hardware/PCB/Power/Clock/Reset/Security/Thermal, Software/Firmware, RTL Architecture, Verification Plan |
| `implement` | 20–21, 24 | Implementation, Testbench, Synthesis |
| `verify` | 22–23, 25–29 | Simulation, Formal Verification, Place & Route, Timing Closure, Optimization, Debug, System Validation |
| `produce` | 30–32 | Manufacturing, Production Testing, Compliance |
| `sustain` | 33–35 | Documentation, Release, Field Support |

Each phase carries its entry/exit gate (architecture / implementation /
timing / ops) and context files (`ctx/*.md`), so progress is auditable at a
glance.

## Relationship to the toolchain

The generated `Makefile` delegates to `toolchain/flow.sh`, which produces
artifacts under `build/` and renders reports into `docs/<phase>/reports/`.
The report engine's `PHASE_BY_SECTION` maps each report type to the phase
directory where it belongs (e.g. `synth` → `24-synthesis`).
