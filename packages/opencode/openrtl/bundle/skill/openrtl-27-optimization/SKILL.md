---
name: openrtl-27-optimization
description: Execute the OpenRTL Optimization phase (27-optimization). Covers: Post-P&R optimization of performance, area, and power with measurement and iteration.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 27-optimization.
---

# OpenRTL — Optimization (27-optimization)

Post-P&R optimization of performance, area, and power with measurement and iteration.

## When to use
- When running phase `27-optimization` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
26-timing-closure

## Task breakdown (3-tier)
- `T27.1` — Optimization: Hit performance targets.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Performance targets met (latency, bandwidth, throughput)
- [ ] Power and area within budget
- [ ] Optimization results documented

## Required engineering reviews
- `timing` — Timing Review
- `power` — Power Review

## Decisions to log
- DECISION-270 — Optimization targets and results

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/27-optimization/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/27-optimization/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/27-optimization/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
