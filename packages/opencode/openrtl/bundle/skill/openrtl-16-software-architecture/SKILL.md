---
name: openrtl-16-software-architecture
description: Execute the OpenRTL Software Architecture phase (16-software-architecture). Covers: Host/embedded software architecture: platform choice, drivers, services, and the FPGA software interface (memory map, in. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 16-software-architecture.
---

# OpenRTL — Software Architecture (16-software-architecture)

Host/embedded software architecture: platform choice, drivers, services, and the FPGA software interface (memory map, interrupts, DMA).

## When to use
- When running phase `16-software-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
05-system-architecture

## Task breakdown (3-tier)
- `T16.1` — Platform: Choose the software platform.
- `T16.2` — FPGA software interface: Define and implement the FPGA/software boundary.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Software platform (bare metal/RTOS/Linux/Zephyr) selected
- [ ] FPGA/software interface (memory map, interrupts, DMA) defined
- [ ] API and SDK approach documented

## Required engineering reviews
- `architecture` — Architecture Review

## Decisions to log
- DECISION-160 — Software platform and FPGA interface

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/16-software-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/16-software-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/16-software-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
