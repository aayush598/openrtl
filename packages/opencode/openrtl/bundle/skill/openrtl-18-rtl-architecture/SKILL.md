---
name: openrtl-18-rtl-architecture
description: Execute the OpenRTL RTL Architecture phase (18-rtl-architecture). Covers: Micro-architecture and design spec for every module: interface contracts, datapath, FSM structure, and module index, bef. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 18-rtl-architecture.
---

# OpenRTL — RTL Architecture (18-rtl-architecture)

Micro-architecture and design spec for every module: interface contracts, datapath, FSM structure, and module index, before coding begins.

## When to use
- When running phase `18-rtl-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture, 12-clock-architecture, 13-reset-architecture, 14-security-architecture

## Task breakdown (3-tier)
- `T18.1` — Micro-architecture: Specify module interfaces and internal structure.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Design spec produced for every module
- [ ] Module index and interface contracts defined
- [ ] RTL architecture reviewed

## Required engineering reviews
- `rtl` — RTL Review
- `architecture` — Architecture Review

## Decisions to log
- DECISION-180 — Micro-architecture and module decomposition

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/18-rtl-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/18-rtl-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/18-rtl-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
