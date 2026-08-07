---
name: openrtl-03-requirements
description: Execute the OpenRTL Requirements phase (03-requirements). Covers: Extremely detailed requirements file covering all non-functional and functional domains, plus PRD, SRS, FRS, risk regist. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 03-requirements.
---

# OpenRTL — Requirements (03-requirements)

Extremely detailed requirements file covering all non-functional and functional domains, plus PRD, SRS, FRS, risk register, and traceability.

## When to use
- When running phase `03-requirements` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
01-ideation, 02-market

## Task breakdown (3-tier)
- `T03.1` — Non-functional requirements: Capture every non-functional requirement category.
- `T03.2` — Requirements documents: Generate PRD, SRS, FRS and traceability matrix.
- `T03.3` — Risk register: Create a living risk register.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Requirements Complete: every requirement categorized and approved
- [ ] Requirements Reviewed by the requirements review
- [ ] Requirements Approved with explicit user sign-off
- [ ] Traceable: PRD -> SRS -> FRS -> test cases
- [ ] Risk register initialized and reviewed

## Required engineering reviews
- `requirements` — Requirements Review

## Decisions to log
- DECISION-030 — Requirements baseline approval

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/03-requirements/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/03-requirements/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/03-requirements/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
