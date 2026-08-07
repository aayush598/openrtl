---
description: Manage the workflow engine (status/advance/resume/rollback).
subtask: true
---

Manage the OpenRTL workflow engine.

Usage: /openrtl-workflow <status|advance|resume|rollback> [phase]

1. Load the openrtl-workflow skill.
2. Read docs/workflow/workflow.json.
3. status: report current phase, deps, gate, blockers.
4. advance: move to next runnable phase when deps satisfied + gate passed + reviews done.
5. resume: continue from the current phase.
6. rollback <phase>: re-open a phase for rework.
