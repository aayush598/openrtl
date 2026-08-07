---
name: openrtl-31-production-testing
description: Execute the OpenRTL Production Testing phase (31-production-testing). Covers: Production test coverage, fixtures, and yield analysis.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 31-production-testing.
---

# OpenRTL — Production Testing (31-production-testing)

Production test coverage, fixtures, and yield analysis.

## When to use
- When running phase `31-production-testing` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
30-manufacturing

## Task breakdown (3-tier)
- `T31.1` — Test coverage: Define production tests.
- `T31.2` — Yield analysis: Monitor and improve yield.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Production test coverage defined
- [ ] ATE fixtures and scripts in place
- [ ] Yield baseline established

## Required engineering reviews
- `manufacturing` — Manufacturing Review

## Decisions to log
- DECISION-310 — Production test strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/31-production-testing/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/31-production-testing/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/31-production-testing/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
