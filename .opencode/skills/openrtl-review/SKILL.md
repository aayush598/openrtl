---
name: openrtl-review
description: Execute an OpenRTL engineering review against the review tickets in docs/_reviews/. Findings carry a severity (block/non-block). Blocking findings must be resolved or waived before the related phase can close its gate.
---

# OpenRTL — Engineering Review

## Procedure
1. Load the review ticket: `docs/_reviews/<type>-review.md`.
2. Read the phase context files under review.
3. Record findings with ID, description, severity (block/non-block), owner, and verifier.
4. Non-blocking findings create follow-up tasks.
5. Blocking findings block the phase gate until resolved or waived.

## Review types
- `requirements` — Requirements Review: Verify requirements are complete, unambiguous, testable, and approved.
- `architecture` — Architecture Review: Verify architecture meets requirements with sound trade-offs and recorded decisions.
- `hardware` — Hardware Review: Verify hardware design against architecture, interfaces, and constraints.
- `rtl` — RTL Review: Verify RTL correctness, coding standards, CDC/reset cleanliness, and lint results.
- `verification` — Verification Review: Verify verification plan, coverage closure, and sign-off criteria.
- `timing` — Timing Review: Verify constraints and timing closure with signed-off reports.
- `power` — Power Review: Verify power budget, estimation, and thermal margin.
- `security` — Security Review: Verify threat model, secure boot, crypto, and tamper resistance.
- `manufacturing` — Manufacturing Review: Verify BOM, supply chain, DFM, and production readiness.
- `release` — Release Review: Verify release readiness: baseline, documentation, and sign-off.
