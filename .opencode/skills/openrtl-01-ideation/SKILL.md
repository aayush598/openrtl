---
name: openrtl-01-ideation
description: Execute the OpenRTL Ideation phase (01-ideation). Covers: Translate the project description into a detailed ideation document. User confirmation gate before requirements.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 01-ideation.
---

# OpenRTL — Ideation (01-ideation)

Translate the project description into a detailed ideation document. User confirmation gate before requirements.

## When to use
- When running phase `01-ideation` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
00-project

## Task breakdown (3-tier)
- `T01.1` — Ideation document: Produce a complete ideation document covering vision, scope, value, and feasibility.
- `T01.2` — User confirmation gate: Get explicit user approval of the ideation document before proceeding.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Ideation document produced covering vision, scope, value, and feasibility
- [ ] Explicit user approval recorded
- [ ] Concept alternatives compared with recommendation

## Required engineering reviews
- `requirements` — Requirements Review

## Decisions to log
- DECISION-010 — Chosen concept direction and rationale

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/01-ideation/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/01-ideation/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/01-ideation/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
