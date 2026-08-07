---
name: openrtl-04-feasibility
description: Execute the OpenRTL Feasibility phase (04-feasibility). Covers: Technical, market, schedule, and manufacturing feasibility study with alternative trade-offs. Produces the go/no-go reco. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 04-feasibility.
---

# OpenRTL — Feasibility (04-feasibility)

Technical, market, schedule, and manufacturing feasibility study with alternative trade-offs. Produces the go/no-go recommendation that gates architecture work.

## When to use
- When running phase `04-feasibility` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
02-market, 03-requirements

## Task breakdown (3-tier)
- `T04.1` — Technical feasibility: Assess technical risk against requirements.
- `T04.2` — Trade study and go/no-go: Compare alternatives and decide.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Technical feasibility assessed against every top requirement
- [ ] Market and schedule feasibility assessed
- [ ] Alternative trade study completed with weighted scoring
- [ ] Go/no-go recommendation documented and approved

## Required engineering reviews
- `requirements` — Requirements Review
- `architecture` — Architecture Review

## Decisions to log
- DECISION-040 — Feasibility go/no-go recommendation

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/04-feasibility/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/04-feasibility/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/04-feasibility/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
