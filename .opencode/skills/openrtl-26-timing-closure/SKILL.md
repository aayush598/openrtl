---
name: openrtl-26-timing-closure
description: Execute the OpenRTL Timing Closure phase (26-timing-closure). Covers: Static timing analysis, constraints, optimization, and reports.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 26-timing-closure.
---

# OpenRTL — Timing Closure (26-timing-closure)

Static timing analysis, constraints, optimization, and reports.

## When to use
- When running phase `26-timing-closure` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
25-place-and-route

## Task breakdown (3-tier)
- `T26.1` — Constraints: Write complete timing constraints.
- `T26.2` — Optimization: Achieve timing closure.
- `T26.3` — Reports: Generate complete timing reports.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Constraints complete and reviewed
- [ ] WNS/TNS and hold/setup violations resolved
- [ ] Timing sign-off reports archived

## Required engineering reviews
- `timing` — Timing Review

## Decisions to log
- DECISION-260 — Timing sign-off

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/26-timing-closure/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/26-timing-closure/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/26-timing-closure/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
