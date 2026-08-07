---
name: openrtl-17-firmware-architecture
description: Execute the OpenRTL Firmware Architecture phase (17-firmware-architecture). Covers: Firmware architecture for boot, configuration, diagnostics, and security, plus the hardware abstraction layer.. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 17-firmware-architecture.
---

# OpenRTL — Firmware Architecture (17-firmware-architecture)

Firmware architecture for boot, configuration, diagnostics, and security, plus the hardware abstraction layer.

## When to use
- When running phase `17-firmware-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
14-security-architecture, 16-software-architecture

## Task breakdown (3-tier)
- `T17.1` — Firmware architecture: Define firmware structure.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Firmware architecture reviewed
- [ ] Boot/init sequence defined
- [ ] HAL and diagnostics approach defined

## Required engineering reviews
- `architecture` — Architecture Review

## Decisions to log
- DECISION-170 — Firmware architecture and boot sequence

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/17-firmware-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/17-firmware-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/17-firmware-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
