---
description: Run a specific OpenRTL phase (e.g. /openrtl-phase 20-implementation).
subtask: true
---

Execute a specific OpenRTL phase end-to-end.

1. Identify the requested phase id (e.g. 20-implementation) or the current pending phase.
2. Load the matching phase skill and openrtl-task-manager.
3. Read docs/<phase>/status.md, gates.md, and tasks/.
4. Execute every unchecked tier-3 step, writing outputs to the phase's context files.
5. Record required decisions and run the phase reviews.
6. Close the quality gate (or record an approved waiver); update status.md and the task index.
