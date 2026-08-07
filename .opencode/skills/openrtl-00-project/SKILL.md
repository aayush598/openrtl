---
name: openrtl-00-project
description: Execute the OpenRTL Project phase (00-project). Covers: Initialize the OpenRTL workspace, project metadata, decision log, toolchain, and directory structure. Every subsequent p. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 00-project.
---

# OpenRTL — Project (00-project)

Initialize the OpenRTL workspace, project metadata, decision log, toolchain, and directory structure. Every subsequent phase reads and updates the context files created here.

## When to use
- When running phase `00-project` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
(none — entry phase)

## Task breakdown (3-tier)
- `T00.1` — Project scaffold: Create the OpenRTL project directory tree and configuration.
- `T00.2` — Project description intake: Capture the user's full product description as the authoritative input.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Workspace initialized with all 36 phase folders
- [ ] Project metadata (openrtl-project.json / project-schema.json) created and versioned
- [ ] Toolchain verified and versions recorded
- [ ] Decision log initialized with template and index

## Required engineering reviews
- `architecture` — Architecture Review

## Decisions to log
- DECISION-000 — Decision log format and workflow
- DECISION-001 — Toolchain and vendor-tool adapter policy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/00-project/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/00-project/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/00-project/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
