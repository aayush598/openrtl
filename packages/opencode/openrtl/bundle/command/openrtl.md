---
description: Start or continue the OpenRTL FPGA/IC product-development workflow.
subtask: true
---

Start or continue the OpenRTL workflow.

1. Load the openrtl-init, openrtl-workflow, and openrtl-task-manager skills.
2. If no project description exists, ask the user for the complete product description and store it in docs/00-project/project-description.md.
3. Determine the current phase from docs/workflow/workflow.json and docs/tasks/index.md.
4. Execute the current phase: load its skill, run its 3-tier tasks, record decisions, run reviews, and close the quality gate.
5. Stop at user approval gates and present the generated files.
6. Report the next phase and any blocking findings.
