---
name: openrtl-task-manager
description: Manage the OpenRTL 9-level task engine (Epic -> Task -> Subtask -> Microtask -> Checklist -> Completion criteria -> Verification -> Review -> Approval -> Done) and the 3-tier task files. Use to list, advance, verify, and close tasks.
---

# OpenRTL — Task Manager

## Task hierarchy
1. Epic (docs/00-project epics)
2. Task (docs/<phase>/tasks/<id>.md)
3. Subtask (S1..S n in each task file)
4. Microtask (checkbox steps)
5. Checklist (completion criteria block)
6. Verification
7. Review
8. Approval
9. Done

## Rules
- Nothing is done until verified, reviewed, and approved.
- Open tickets become follow-up tasks with owners.
- Task index (`docs/tasks/index.md`) is the source of truth for progress.
