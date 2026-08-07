---
name: openrtl-20-implementation
description: Execute the OpenRTL Implementation phase (20-implementation). Covers: Complete, professional, industrial-grade RTL/HDL coding with strict coding standards and all required modules.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 20-implementation.
---

# OpenRTL — Implementation (20-implementation)

Complete, professional, industrial-grade RTL/HDL coding with strict coding standards and all required modules.

## When to use
- When running phase `20-implementation` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
18-rtl-architecture

## Task breakdown (3-tier)
- `T20.1` — Language and standards: Choose HDL and establish coding standards.
- `T20.2` — Module implementation: Implement every required module to production quality.
- `T20.3` — Digital design techniques: Apply best-practice techniques throughout.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] RTL lint clean
- [ ] CDC clean
- [ ] Reset clean
- [ ] Parameterized and documented
- [ ] RTL reviewed (rtl review)
- [ ] Module index complete with no missing modules

## Required engineering reviews
- `rtl` — RTL Review

## Decisions to log
- DECISION-200 — HDL language and coding standards baseline

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/20-implementation/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/20-implementation/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/20-implementation/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
