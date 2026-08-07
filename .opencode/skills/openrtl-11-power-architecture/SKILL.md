---
name: openrtl-11-power-architecture
description: Execute the OpenRTL Power Architecture phase (11-power-architecture). Covers: Power rail architecture, sequencing, estimation, and margin analysis that constrains hardware and RTL.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 11-power-architecture.
---

# OpenRTL — Power Architecture (11-power-architecture)

Power rail architecture, sequencing, estimation, and margin analysis that constrains hardware and RTL.

## When to use
- When running phase `11-power-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture, 08-component-selection

## Task breakdown (3-tier)
- `T11.1` — Power design: Design the power architecture.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Power architecture reviewed (power review)
- [ ] Rail list, sequencing, and regulator selection documented
- [ ] Power estimate completed and within budget

## Required engineering reviews
- `power` — Power Review

## Decisions to log
- DECISION-110 — Power architecture and regulators

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/11-power-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/11-power-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/11-power-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
