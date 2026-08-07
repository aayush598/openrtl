---
name: openrtl-13-reset-architecture
description: Execute the OpenRTL Reset Architecture phase (13-reset-architecture). Covers: Reset strategy: async vs sync, reset domains, deassertion synchronization, and reset tree. Consumed by RTL implementatio. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 13-reset-architecture.
---

# OpenRTL — Reset Architecture (13-reset-architecture)

Reset strategy: async vs sync, reset domains, deassertion synchronization, and reset tree. Consumed by RTL implementation.

## When to use
- When running phase `13-reset-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture

## Task breakdown (3-tier)
- `T13.1` — Reset strategy: Define the reset architecture.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Reset strategy defined and reviewed
- [ ] Reset domains and deassertion synchronization specified
- [ ] Reset tree and timing handled

## Required engineering reviews
- `rtl` — RTL Review

## Decisions to log
- DECISION-130 — Reset strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/13-reset-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/13-reset-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/13-reset-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
