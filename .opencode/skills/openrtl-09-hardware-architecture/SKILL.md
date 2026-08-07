---
name: openrtl-09-hardware-architecture
description: Execute the OpenRTL Hardware Architecture phase (09-hardware-architecture). Covers: Board-level hardware architecture: board partitioning, assets, and interface assignment that drives PCB and each hardwar. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 09-hardware-architecture.
---

# OpenRTL — Hardware Architecture (09-hardware-architecture)

Board-level hardware architecture: board partitioning, assets, and interface assignment that drives PCB and each hardware-subsystem architecture.

## When to use
- When running phase `09-hardware-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
07-fpga-selection, 08-component-selection

## Task breakdown (3-tier)
- `T09.1` — Board architecture: Define the board-level architecture.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Board architecture reviewed
- [ ] Board partitioning and asset allocation completed
- [ ] Interface-to-block assignment complete
- [ ] Hardware architecture decision logged

## Required engineering reviews
- `hardware` — Hardware Review

## Decisions to log
- DECISION-090 — Board architecture and asset allocation

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/09-hardware-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/09-hardware-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/09-hardware-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
