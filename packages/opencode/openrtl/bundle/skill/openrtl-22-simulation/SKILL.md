---
name: openrtl-22-simulation
description: Execute the OpenRTL Simulation phase (22-simulation). Covers: Run the regression suite, measure coverage, and close coverage gaps using open-source simulators.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 22-simulation.
---

# OpenRTL — Simulation (22-simulation)

Run the regression suite, measure coverage, and close coverage gaps using open-source simulators.

## When to use
- When running phase `22-simulation` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
21-testbench

## Task breakdown (3-tier)
- `T22.1` — Coverage and regression: Measure and close coverage.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Regression suite runs deterministically
- [ ] Coverage goals met (code, functional, toggle, FSM, assertion)
- [ ] Coverage gaps closed or justified
- [ ] Simulation sign-off recorded

## Required engineering reviews
- `verification` — Verification Review

## Decisions to log
- DECISION-220 — Simulation regression sign-off

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/22-simulation/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/22-simulation/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/22-simulation/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
