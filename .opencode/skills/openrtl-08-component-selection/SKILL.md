---
name: openrtl-08-component-selection
description: Execute the OpenRTL Component Selection phase (08-component-selection). Covers: Select all major components (memory, transceivers, PMIC, PHY, ADCs) and build the BOM draft with suppliers and lifecycle. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 08-component-selection.
---

# OpenRTL — Component Selection (08-component-selection)

Select all major components (memory, transceivers, PMIC, PHY, ADCs) and build the BOM draft with suppliers and lifecycle assessment.

## When to use
- When running phase `08-component-selection` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
06-interface-definition, 07-fpga-selection

## Task breakdown (3-tier)
- `T08.1` — Major component selection: Select memory, PHYs, power, and analog components.
- `T08.2` — BOM and lifecycle: Build the BOM draft and assess lifecycle.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] All major components selected and justified
- [ ] BOM draft created with part numbers and suppliers
- [ ] Approved Vendor List (AVL) started
- [ ] Lifecycle/obsolescence risk noted per critical component

## Required engineering reviews
- `hardware` — Hardware Review

## Decisions to log
- DECISION-080 — Component selections and BOM draft

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/08-component-selection/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/08-component-selection/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/08-component-selection/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
