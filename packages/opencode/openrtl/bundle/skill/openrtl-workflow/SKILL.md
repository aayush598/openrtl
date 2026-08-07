---
name: openrtl-workflow
description: Manage the OpenRTL workflow engine. Reads docs/workflow/workflow.json (the phase DAG), advances through phases respecting dependencies, gates, and reviews, and supports resume, rollback, and presets.
---

# OpenRTL — Workflow Engine

## Model
- `docs/workflow/workflow.json` defines the phase DAG: each step lists its dependencies, gate mode (blocking), and required reviews.
- Modes: sequential, parallel, conditional, dag.
- Presets: full (all 36 phases, blocking gates) or fast-proto (skips market/formal/manufacturing-heavy phases).

## Operations
- `advance` — move to the next runnable phase (deps satisfied + gate passed + reviews done).
- `resume` — continue from the current phase after a pause.
- `rollback <phase>` — re-open a phase for rework.
- `status` — report current position, dependencies, and blockers.

## Rule
- Do not advance past a phase whose gate is open or whose blocking review findings are unresolved.
