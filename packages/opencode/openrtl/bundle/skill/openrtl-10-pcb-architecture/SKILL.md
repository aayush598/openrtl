---
name: openrtl-10-pcb-architecture
description: Execute the OpenRTL PCB Architecture phase (10-pcb-architecture). Covers: PCB stackup and layout strategy defined before detailed design: layer stack, controlled impedance, routing families, and. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 10-pcb-architecture.
---

# OpenRTL — PCB Architecture (10-pcb-architecture)

PCB stackup and layout strategy defined before detailed design: layer stack, controlled impedance, routing families, and SI/PI/EMC approach.

## When to use
- When running phase `10-pcb-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
09-hardware-architecture

## Task breakdown (3-tier)
- `T10.1` — Stackup and strategy: Define the PCB stackup and layout strategy.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Stackup defined with controlled impedance layers
- [ ] Routing families and length-matching strategy defined
- [ ] SI/PI/EMC approach documented

## Required engineering reviews
- `hardware` — Hardware Review

## Decisions to log
- DECISION-100 — PCB stackup and routing strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/10-pcb-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/10-pcb-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/10-pcb-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
