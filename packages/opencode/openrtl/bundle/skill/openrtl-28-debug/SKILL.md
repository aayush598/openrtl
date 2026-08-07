---
name: openrtl-28-debug
description: Execute the OpenRTL Debug phase (28-debug). Covers: Debug infrastructure and tools: instrumentation, JTAG, logic analyzer, and software debug channels.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 28-debug.
---

# OpenRTL — Debug (28-debug)

Debug infrastructure and tools: instrumentation, JTAG, logic analyzer, and software debug channels.

## When to use
- When running phase `28-debug` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
22-simulation, 25-place-and-route

## Task breakdown (3-tier)
- `T28.1` — Hardware debug: Set up in-circuit debug.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Debug infrastructure built (ILA/SignalTap or OSS equivalent)
- [ ] JTAG and boundary scan ready
- [ ] Debug channels documented

## Required engineering reviews
- `verification` — Verification Review

## Decisions to log
- DECISION-280 — Debug infrastructure

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/28-debug/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/28-debug/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/28-debug/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
