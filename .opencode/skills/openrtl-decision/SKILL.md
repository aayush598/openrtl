---
name: openrtl-decision
description: Create and manage the OpenRTL decision log / Design Decision Records. Fields: decision, why, alternatives, trade-offs, consequences, owner, review, approval, impact, cost, performance, risk. Use whenever a phase requires a logged decision.
---

# OpenRTL — Decision Log / DDR

## When to use
- Any phase with decisions listed in its README or gates.
- Any architecture, selection, or trade-off decision.

## Template (docs/00-project/decisions/DECISION-XXX.md)
1. **Decision** — what we decided.
2. **Context / Why** — background and drivers.
3. **Alternatives considered** — with trade-offs.
4. **Trade-offs / Impact** — cost, performance, power, risk, schedule.
5. **Consequences** — what follows.
6. **Review & Approval** — reviewer and approver, and user sign-off when required.

## Rules
- Assign the next DECISION-XXX id and add it to INDEX.md.
- Approved decisions become binding constraints for later phases.
- Waivers must reference the decision that grants them.
