---
name: openrtl-12-clock-architecture
description: Execute the OpenRTL Clock Architecture phase (12-clock-architecture). Covers: Clock generation, distribution, domains, and jitter budget. Defines all CDC domains consumed by RTL.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 12-clock-architecture.
---

# OpenRTL — Clock Architecture (12-clock-architecture)

Clock generation, distribution, domains, and jitter budget. Defines all CDC domains consumed by RTL.

## When to use
- When running phase `12-clock-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture, 09-hardware-architecture

## Task breakdown (3-tier)
- `T12.1` — Clock tree: Design clock generation and distribution.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Clock tree and generation designed
- [ ] All clock domains and CDCs enumerated
- [ ] Jitter/uncertainty budget completed

## Required engineering reviews
- `architecture` — Architecture Review
- `rtl` — RTL Review

## Decisions to log
- DECISION-120 — Clock tree and CDC plan

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/12-clock-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/12-clock-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/12-clock-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
