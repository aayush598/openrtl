---
name: openrtl-05-system-architecture
description: Execute the OpenRTL System Architecture phase (05-system-architecture). Covers: Full system architecture: block diagram, data flow, memory, bus, partitioning, boot/update, and quantitative estimates. . Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 05-system-architecture.
---

# OpenRTL — System Architecture (05-system-architecture)

Full system architecture: block diagram, data flow, memory, bus, partitioning, boot/update, and quantitative estimates. Feeds all subsystem architecture phases.

## When to use
- When running phase `05-system-architecture` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
03-requirements, 04-feasibility

## Task breakdown (3-tier)
- `T05.1` — Architecture views: Create all system architecture documents.
- `T05.2` — Partitioning: Decide the processing element partition.
- `T05.3` — Quantitative estimates: Produce first-pass engineering calculations.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] System architecture reviewed by the architecture review
- [ ] Block diagram, data flow, memory, bus, partitioning completed
- [ ] Boot and update architecture defined
- [ ] Quantitative estimates (bandwidth, latency, power, resources) completed
- [ ] Architecture decisions logged and approved

## Required engineering reviews
- `architecture` — Architecture Review

## Decisions to log
- DECISION-050 — System partitioning and processing element selection
- DECISION-051 — Memory hierarchy and bus architecture

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/05-system-architecture/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/05-system-architecture/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/05-system-architecture/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
