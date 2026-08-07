---
name: openrtl-24-synthesis
description: Execute the OpenRTL Synthesis phase (24-synthesis). Covers: Synthesis with Yosys (or vendor flow), lint-clean netlist, and resource utilization assessment.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 24-synthesis.
---

# OpenRTL — Synthesis (24-synthesis)

Synthesis with Yosys (or vendor flow), lint-clean netlist, and resource utilization assessment.

## When to use
- When running phase `24-synthesis` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
20-implementation

## Task breakdown (3-tier)
- `T24.1` — Synthesis: Run and review synthesis.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Synthesis completes cleanly
- [ ] Resource utilization within budget
- [ ] Synthesis netlist archived

## Required engineering reviews
- `timing` — Timing Review

## Decisions to log
- DECISION-240 — Synthesis flow and target utilization

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/24-synthesis/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/24-synthesis/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/24-synthesis/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
