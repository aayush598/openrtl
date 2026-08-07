---
name: openrtl-32-compliance
description: Execute the OpenRTL Compliance phase (32-compliance). Covers: Regulatory compliance and certification: EMI/EMC, safety, materials, and vertical-market requirements.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 32-compliance.
---

# OpenRTL — Compliance (32-compliance)

Regulatory compliance and certification: EMI/EMC, safety, materials, and vertical-market requirements.

## When to use
- When running phase `32-compliance` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
03-requirements, 29-system-validation

## Task breakdown (3-tier)
- `T32.1` — Certifications: Achieve required certifications.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Compliance matrix built from requirements
- [ ] EMI/EMC testing planned/executed
- [ ] RoHS/REACH and certifications tracked
- [ ] Compliance sign-off documented

## Required engineering reviews
- `manufacturing` — Manufacturing Review

## Decisions to log
- DECISION-320 — Compliance and certification plan

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/32-compliance/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/32-compliance/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/32-compliance/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
