---
name: openrtl-init
description: Initialize or verify an OpenRTL workspace. Loads project metadata, workflow state, decision log, and phase status; reports the current phase and next actions. Use at the start of any OpenRTL session.
---

# OpenRTL — Initialize / Resume

## Steps
1. Verify the workspace is scaffolded: `docs/`, `openrtl-project.json`, `opencode.jsonc`, `.opencode/`.
2. Load project metadata from `openrtl-project.json` (name, roles, preset, lifecycle).
3. Read `docs/workflow/workflow.json` and `docs/tasks/index.md` to find the current phase.
4. For the current phase, read `docs/<phase>/status.md`, `gates.md`, and the review tickets.
5. Report: current phase, gate status, blocking findings, and the next action.
