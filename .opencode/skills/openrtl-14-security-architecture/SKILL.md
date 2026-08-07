---
name: openrtl-14-security-architecture
description: Execute the OpenRTL Security Architecture phase (14-security-architecture). Covers: Threat model and security architecture: secure boot, crypto, key management, anti-tamper, and debug lock. Drives hardwar. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 14-security-architecture.
---

# OpenRTL — Security Architecture (14-security-architecture)

Threat model and security architecture: secure boot, crypto, key management, anti-tamper, and debug lock. Drives hardware and firmware security implementation.

## When to use
- When running phase `14-security-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
03-requirements, 05-system-architecture

## Task breakdown (3-tier)
- `T14.1` — Threat model: Model threats and trust boundaries.
- `T14.2` — Security design: Define the security architecture.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Threat model completed
- [ ] Security architecture reviewed (security review)
- [ ] Key management and lifecycle defined
- [ ] Debug and test access policy defined

## Required engineering reviews
- `security` — Security Review

## Decisions to log
- DECISION-140 — Security architecture and key management

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/14-security-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/14-security-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/14-security-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
