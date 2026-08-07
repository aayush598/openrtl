---
name: openrtl-07-fpga-selection
description: Execute the OpenRTL FPGA Selection phase (07-fpga-selection). Covers: Select the FPGA with a rigorous criteria and vendor trade study.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 07-fpga-selection.
---

# OpenRTL — FPGA Selection (07-fpga-selection)

Select the FPGA with a rigorous criteria and vendor trade study.

## When to use
- When running phase `07-fpga-selection` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture, 06-interface-definition

## Task breakdown (3-tier)
- `T07.1` — Selection criteria: Define and score selection criteria.
- `T07.2` — Vendor trade study: Compare major FPGA vendors.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Selection criteria defined and scored
- [ ] Vendor trade study completed
- [ ] FPGA part selected with rationale
- [ ] Open-source toolchain support confirmed (or fallback defined)

## Required engineering reviews
- `architecture` — Architecture Review
- `hardware` — Hardware Review

## Decisions to log
- DECISION-070 — FPGA part selection

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/07-fpga-selection/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/07-fpga-selection/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/07-fpga-selection/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
