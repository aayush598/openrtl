---
name: openrtl-21-testbench
description: Execute the OpenRTL Testbench phase (21-testbench). Covers: Build reusable, UVM/classic/Cocotb testbenches with drivers, monitors, scoreboards, and checkers.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 21-testbench.
---

# OpenRTL — Testbench (21-testbench)

Build reusable, UVM/classic/Cocotb testbenches with drivers, monitors, scoreboards, and checkers.

## When to use
- When running phase `21-testbench` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
19-verification-plan, 20-implementation

## Task breakdown (3-tier)
- `T21.1` — Testbench infrastructure: Build reusable testbenches.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Testbench infrastructure built and reusable
- [ ] Drivers/monitors/scoreboards/checkers present per module
- [ ] Testbench reviewed

## Required engineering reviews
- `verification` — Verification Review

## Decisions to log
- DECISION-210 — Testbench architecture and reuse strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/21-testbench/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/21-testbench/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/21-testbench/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
