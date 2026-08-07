---
name: openrtl-gate
description: Evaluate and close OpenRTL quality gates. Reads docs/<phase>/gates.md, checks every exit criterion, blocks progression when any criterion fails, and records approved waivers. Use before advancing between phases.
---

# OpenRTL — Quality Gate

## Evaluation
For each exit criterion in `docs/<phase>/gates.md`:
- pass — evidence exists; or
- fail — missing/incomplete evidence (blocks progression); or
- waive — explicitly approved, recorded, and referenced in the decision log.

## Blocking rule
- Progression to the next phase is BLOCKED until every criterion passes or is waived.
- Do not mark a phase complete while any criterion is fail.
- If blocked, report the specific failing criteria and what must change.

## Waiver
- A waiver requires an approved decision entry and a verifier.
- Record it in the gate row with the waiver reason.
