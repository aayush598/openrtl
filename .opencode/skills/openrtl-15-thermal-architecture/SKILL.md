---
name: openrtl-15-thermal-architecture
description: Execute the OpenRTL Thermal Architecture phase (15-thermal-architecture). Covers: Thermal analysis and cooling strategy: heat dissipation, airflow, heatsink selection, and thermal simulation plan.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 15-thermal-architecture.
---

# OpenRTL — Thermal Architecture (15-thermal-architecture)

Thermal analysis and cooling strategy: heat dissipation, airflow, heatsink selection, and thermal simulation plan.

## When to use
- When running phase `15-thermal-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
11-power-architecture

## Task breakdown (3-tier)
- `T15.1` — Thermal design: Define the cooling strategy.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Thermal analysis completed at worst-case ambient
- [ ] Cooling strategy (passive/active) defined
- [ ] Junction temperatures verified within limits

## Required engineering reviews
- `power` — Power Review

## Decisions to log
- DECISION-150 — Thermal and cooling strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/15-thermal-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/15-thermal-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/15-thermal-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
