---
name: openrtl-02-market
description: Execute the OpenRTL Market phase (02-market). Covers: Market analysis: personas, TAM/SAM/SOM, competitive landscape, pricing, and voice-of-customer. Feeds requirements and th. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase 02-market.
---

# OpenRTL — Market (02-market)

Market analysis: personas, TAM/SAM/SOM, competitive landscape, pricing, and voice-of-customer. Feeds requirements and the business case.

## When to use
- When running phase `02-market` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
01-ideation

## Task breakdown (3-tier)
- `T02.1` — Market sizing: Quantify the addressable market and segment.
- `T02.2` — Competition and pricing: Position the product against competition.

## Quality gate (exit criteria — all must pass or be waived)
- [ ] Market analysis with TAM/SAM/SOM completed
- [ ] Personas and key use cases defined
- [ ] Competitive landscape with differentiation strategy documented
- [ ] Pricing model proposed

## Required engineering reviews
- `requirements` — Requirements Review

## Decisions to log
- DECISION-020 — Target market segment and pricing model

## Workflow
1. Load the `openrtl-task-manager` skill and read `docs/02-market/status.md`, `gates.md`, and `tasks/`.
2. Execute every unchecked tier-3 step in order, writing outputs to `docs/02-market/`.
3. Record required decisions in `docs/00-project/decisions/` and update the INDEX.
4. Run the phase review ticket(s) under `docs/_reviews/`; resolve or waive blocking findings.
5. Close the quality gate in `docs/02-market/gates.md` (or record an approved waiver).
6. Update `status.md`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as `blocked` with a reason instead of proceeding.
