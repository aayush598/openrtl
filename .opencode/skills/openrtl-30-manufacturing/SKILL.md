---
name: openrtl-30-manufacturing
description: Execute the OpenRTL Manufacturing phase (30-manufacturing). Covers: Manufacturing planning and control: BOM, supply chain, fabrication, assembly, and traceability.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 30-manufacturing.
---

# OpenRTL — Manufacturing (30-manufacturing)

Manufacturing planning and control: BOM, supply chain, fabrication, assembly, and traceability.

## When to use
- When running phase `30-manufacturing` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
08-component-selection, 29-system-validation

## Task breakdown (3-tier)
- `T30.1` — Supply chain: Manage BOM and components.
- `T30.2` — Assembly process: Define fabrication and assembly flow.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] BOM finalized with AVL and alternates
- [ ] Fabrication and assembly flow defined
- [ ] Inspection and test plans defined
- [ ] Traceability plan in place

## Required engineering reviews
- `manufacturing` — Manufacturing Review

## Decisions to log
- DECISION-300 — Manufacturing and assembly strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/30-manufacturing/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/30-manufacturing/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/30-manufacturing/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
