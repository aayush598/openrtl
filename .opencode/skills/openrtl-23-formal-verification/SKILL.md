---
name: openrtl-23-formal-verification
description: Execute the OpenRTL Formal Verification phase (23-formal-verification). Covers: Formal verification of critical blocks with SymbiYosys: equivalence, bounded model checking, and property proofs.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 23-formal-verification.
---

# OpenRTL — Formal Verification (23-formal-verification)

Formal verification of critical blocks with SymbiYosys: equivalence, bounded model checking, and property proofs.

## When to use
- When running phase `23-formal-verification` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
22-simulation

## Task breakdown (3-tier)
- `T23.1` — Formal properties: Prove critical behavior formally.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Formal properties defined for critical blocks
- [ ] BMC/proofs run and pass
- [ ] Formal sign-off documented

## Required engineering reviews
- `verification` — Verification Review

## Decisions to log
- DECISION-230 — Formal verification scope and sign-off

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/23-formal-verification/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/23-formal-verification/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/23-formal-verification/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
