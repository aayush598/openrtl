---
name: openrtl-25-place-and-route
description: Execute the OpenRTL Place & Route phase (25-place-and-route). Covers: Placement and routing (nextpnr or vendor flow), congestion, and bitstream generation.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 25-place-and-route.
---

# OpenRTL — Place & Route (25-place-and-route)

Placement and routing (nextpnr or vendor flow), congestion, and bitstream generation.

## When to use
- When running phase `25-place-and-route` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
24-synthesis

## Task breakdown (3-tier)
- `T25.1` — Place and route: Place, route, and generate the bitstream.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] P&R completes without errors
- [ ] Congestion and routability acceptable
- [ ] Bitstream generated

## Required engineering reviews
- `timing` — Timing Review

## Decisions to log
- DECISION-250 — P&R flow and bitstream generation

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/25-place-and-route/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/25-place-and-route/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/25-place-and-route/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
