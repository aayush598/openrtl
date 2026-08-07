---
description: Show or resolve a phase quality gate (pass/fail/waive).
subtask: true
---

Evaluate or resolve an OpenRTL quality gate.

Usage: /openrtl-gate <phase-id> [criterion|all] --status <pass|fail|waive>

1. Load the openrtl-gate skill.
2. Read docs/<phase>/gates.md and evaluate each exit criterion.
3. Mark criteria pass/fail/waive based on evidence; a waiver requires an approved decision.
4. Report whether the phase may advance.
