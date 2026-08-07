---
name: openrtl-34-release
description: Execute the OpenRTL Release phase (34-release). Covers: Release management: versioning, milestones, snapshots/baselines, freeze, release candidates, hotfix and LTS planning, an. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 34-release.
---

# OpenRTL — Release (34-release)

Release management: versioning, milestones, snapshots/baselines, freeze, release candidates, hotfix and LTS planning, and the release review gate.

## When to use
- When running phase `34-release` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
29-system-validation, 32-compliance, 33-documentation

## Task breakdown (3-tier)
- `T34.1` — Release planning: Plan and execute the release.
- `T34.2` — Release sign-off: Close the release.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Release plan with versioning and milestones approved
- [ ] Snapshot/baseline created and frozen
- [ ] Release review passed (release review)
- [ ] Release notes published

## Required engineering reviews
- `release` — Release Review

## Decisions to log
- DECISION-340 — Release baseline and version

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/34-release/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/34-release/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/34-release/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
