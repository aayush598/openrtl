---
name: openrtl-35-field-support
description: Execute the OpenRTL Field Support phase (35-field-support). Covers: Field updates, diagnostics, telemetry, bug tracking, patch management, and end-of-life planning.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 35-field-support.
---

# OpenRTL — Field Support (35-field-support)

Field updates, diagnostics, telemetry, bug tracking, patch management, and end-of-life planning.

## When to use
- When running phase `35-field-support` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
34-release

## Task breakdown (3-tier)
- `T35.1` — Field ops: Enable field support.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Field update channel implemented
- [ ] Remote diagnostics and telemetry defined
- [ ] Bug tracking and patch management process active
- [ ] End-of-life plan defined

## Required engineering reviews
- `release` — Release Review

## Decisions to log
- DECISION-350 — Field support and EOL plan

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/35-field-support/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/35-field-support/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/35-field-support/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
