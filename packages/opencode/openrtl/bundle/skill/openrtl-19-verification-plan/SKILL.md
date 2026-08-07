---
name: openrtl-19-verification-plan
description: Execute the OpenRTL Verification Plan phase (19-verification-plan). Covers: Verification strategy and test plan: levels, methodology, tooling, coverage goals, and sign-off criteria. Verification i. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 19-verification-plan.
---

# OpenRTL — Verification Plan (19-verification-plan)

Verification strategy and test plan: levels, methodology, tooling, coverage goals, and sign-off criteria. Verification is 60-80% of project effort.

## When to use
- When running phase `19-verification-plan` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
03-requirements, 18-rtl-architecture

## Task breakdown (3-tier)
- `T19.1` — Verification strategy: Define the verification approach.
- `T19.2` — Test plan: Write the detailed test plan.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Verification plan reviewed (verification review)
- [ ] Test plan covers all requirements and interfaces
- [ ] Coverage goals and sign-off criteria defined
- [ ] Tooling (OSS simulators/formal) selected

## Required engineering reviews
- `verification` — Verification Review

## Decisions to log
- DECISION-190 — Verification methodology and tooling

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/19-verification-plan/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/19-verification-plan/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/19-verification-plan/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
