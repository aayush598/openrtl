---
name: openrtl-33-documentation
description: Execute the OpenRTL Documentation phase (33-documentation). Covers: Complete product documentation set: engineering, product, manufacturing, and maintenance.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 33-documentation.
---

# OpenRTL — Documentation (33-documentation)

Complete product documentation set: engineering, product, manufacturing, and maintenance.

## When to use
- When running phase `33-documentation` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
29-system-validation, 32-compliance

## Task breakdown (3-tier)
- `T33.1` — Documentation set: Produce all required documents.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Engineering documentation complete
- [ ] Product/manufacturing/maintenance docs complete
- [ ] Documentation reviewed by technical writer

## Required engineering reviews
- `release` — Release Review

## Decisions to log
- DECISION-330 — Documentation set baseline

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/33-documentation/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/33-documentation/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/33-documentation/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
