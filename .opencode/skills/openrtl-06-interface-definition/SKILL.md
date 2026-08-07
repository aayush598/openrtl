---
name: openrtl-06-interface-definition
description: Execute the OpenRTL Interface Definition phase (06-interface-definition). Covers: Define every external and internal interface: electrical, logical, protocol, and mechanical. The authoritative interface. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 06-interface-definition.
---

# OpenRTL — Interface Definition (06-interface-definition)

Define every external and internal interface: electrical, logical, protocol, and mechanical. The authoritative interface contract used by hardware, RTL, firmware, and software.

## When to use
- When running phase `06-interface-definition` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture

## Task breakdown (3-tier)
- `T06.1` — Interface inventory: Enumerate and specify every interface.
- `T06.2` — Pin and signaling plan: Produce the pin and signaling plan.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] All external interfaces specified (electrical, logical, protocol, mechanical)
- [ ] Interface spec reviewed and approved
- [ ] Pin assignment captured
- [ ] Interface decision logged

## Required engineering reviews
- `architecture` — Architecture Review

## Decisions to log
- DECISION-060 — Interface set, protocols, and pin strategy

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/06-interface-definition/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/06-interface-definition/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/06-interface-definition/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
