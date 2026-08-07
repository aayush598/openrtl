---
name: openrtl-29-system-validation
description: Execute the OpenRTL System Validation phase (29-system-validation). Covers: HW + SW + FW integration and on-board system validation against requirements, including field-programmed bitstream.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 29-system-validation.
---

# OpenRTL — System Validation (29-system-validation)

HW + SW + FW integration and on-board system validation against requirements, including field-programmed bitstream.

## When to use
- When running phase `29-system-validation` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
26-timing-closure, 27-optimization, 28-debug

## Task breakdown (3-tier)
- `T29.1` — Integration: Integrate and validate the full system.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Integration test plan executed
- [ ] On-board validation against requirements passed
- [ ] Issues logged and resolved/waived
- [ ] Validation report approved

## Required engineering reviews
- `verification` — Verification Review

## Decisions to log
- DECISION-290 — System validation results acceptance

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/29-system-validation/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/29-system-validation/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/29-system-validation/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
