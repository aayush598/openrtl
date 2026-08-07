// OpenRTL bundle generator.
// Generates the skills, agents, and commands bundle from the task bank so the
// 36-phase lifecycle stays consistent across the project docs and the AI bundle.
//
// Usage:
//   bun run script/gen-bundle.ts [--out <bundle-dir>]
//
// Output dir defaults to ./bundle (relative to this package).

import { PHASES, REVIEWS, type Phase } from "../scaffold/task-bank"
import fs from "fs"
import path from "path"

const args = process.argv.slice(2)
const out = args.indexOf("--out") >= 0 ? args[args.indexOf("--out") + 1] : path.join(__dirname, "..", "bundle")

const SKILL_DIR = path.join(out, "skill")
const AGENT_DIR = path.join(out, "agent")
const CMD_DIR = path.join(out, "command")

function ensure(p: string) {
  fs.mkdirSync(p, { recursive: true })
}
function write(p: string, c: string) {
  ensure(path.dirname(p))
  fs.writeFileSync(p, c)
}
function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// ---------------------------------------------------------------------------
// Skills: one per phase
// ---------------------------------------------------------------------------

function phaseSkill(phase: Phase): string {
  const gates = phase.gates.map((g) => `- [ ] ${g}`).join("\n")
  const reviews = phase.reviews.map((r) => `- \`${r}\` — ${REVIEWS[r].title}`).join("\n")
  const decisions = phase.decisions.map((d) => `- ${d}`).join("\n")
  const tasks = phase.tasks
    .map((t) => `- \`${t.id}\` — ${t.title}: ${t.objective}`)
    .join("\n")
  const deps = phase.dependsOn.length ? phase.dependsOn.join(", ") : "(none — entry phase)"
  return `---
name: openrtl-${phase.id}
description: Execute the OpenRTL ${phase.name} phase (${phase.id}). Covers: ${phase.description.slice(0, 120)}. Produces the phase context files, 3-tier tasks, decision-log entries, quality gate, and reviews. Use when running or resuming phase ${phase.id}.
---

# OpenRTL — ${phase.name} (${phase.id})

${phase.description}

## When to use
- When running phase \`${phase.id}\` in the OpenRTL workflow.
- When resuming, reviewing, or reworking this phase.

## Depends on
${deps}

## Task breakdown (3-tier)
${tasks}

## Quality gate (exit criteria — all must pass or be waived)
${gates}

## Required engineering reviews
${reviews}

## Decisions to log
${decisions}

## Workflow
1. Load the \`openrtl-task-manager\` skill and read \`docs/${phase.id}/status.md\`, \`gates.md\`, and \`tasks/\`.
2. Execute every unchecked tier-3 step in order, writing outputs to \`docs/${phase.id}/\`.
3. Record required decisions in \`docs/00-project/decisions/\` and update the INDEX.
4. Run the phase review ticket(s) under \`docs/_reviews/\`; resolve or waive blocking findings.
5. Close the quality gate in \`docs/${phase.id}/gates.md\` (or record an approved waiver).
6. Update \`status.md\`, the task index, and the workflow state.

## Refusal rule
- If the quality gate is not satisfied and no waiver is approved, do NOT advance to the next phase.
- Mark the phase as \`blocked\` with a reason instead of proceeding.
`
}

// Meta skills
function initSkill(): string {
  return `---
name: openrtl-init
description: Initialize or verify an OpenRTL workspace. Loads project metadata, workflow state, decision log, and phase status; reports the current phase and next actions. Use at the start of any OpenRTL session.
---

# OpenRTL — Initialize / Resume

## Steps
1. Verify the workspace is scaffolded: \`docs/\`, \`openrtl-project.json\`, \`opencode.jsonc\`, \`.opencode/\`.
2. Load project metadata from \`openrtl-project.json\` (name, roles, preset, lifecycle).
3. Read \`docs/workflow/workflow.json\` and \`docs/tasks/index.md\` to find the current phase.
4. For the current phase, read \`docs/<phase>/status.md\`, \`gates.md\`, and the review tickets.
5. Report: current phase, gate status, blocking findings, and the next action.
`
}

function taskManagerSkill(): string {
  return `---
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
- Task index (\`docs/tasks/index.md\`) is the source of truth for progress.
`
}

function decisionSkill(): string {
  return `---
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
`
}

function gateSkill(): string {
  return `---
name: openrtl-gate
description: Evaluate and close OpenRTL quality gates. Reads docs/<phase>/gates.md, checks every exit criterion, blocks progression when any criterion fails, and records approved waivers. Use before advancing between phases.
---

# OpenRTL — Quality Gate

## Evaluation
For each exit criterion in \`docs/<phase>/gates.md\`:
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
`
}

function reviewSkill(): string {
  return `---
name: openrtl-review
description: Execute an OpenRTL engineering review against the review tickets in docs/_reviews/. Findings carry a severity (block/non-block). Blocking findings must be resolved or waived before the related phase can close its gate.
---

# OpenRTL — Engineering Review

## Procedure
1. Load the review ticket: \`docs/_reviews/<type>-review.md\`.
2. Read the phase context files under review.
3. Record findings with ID, description, severity (block/non-block), owner, and verifier.
4. Non-blocking findings create follow-up tasks.
5. Blocking findings block the phase gate until resolved or waived.

## Review types
${Object.entries(REVIEWS)
  .map(([k, v]) => `- \`${k}\` — ${v.title}: ${v.description}`)
  .join("\n")}
`
}

function workflowSkill(): string {
  return `---
name: openrtl-workflow
description: Manage the OpenRTL workflow engine. Reads docs/workflow/workflow.json (the phase DAG), advances through phases respecting dependencies, gates, and reviews, and supports resume, rollback, and presets.
---

# OpenRTL — Workflow Engine

## Model
- \`docs/workflow/workflow.json\` defines the phase DAG: each step lists its dependencies, gate mode (blocking), and required reviews.
- Modes: sequential, parallel, conditional, dag.
- Presets: full (all 36 phases, blocking gates) or fast-proto (skips market/formal/manufacturing-heavy phases).

## Operations
- \`advance\` — move to the next runnable phase (deps satisfied + gate passed + reviews done).
- \`resume\` — continue from the current phase after a pause.
- \`rollback <phase>\` — re-open a phase for rework.
- \`status\` — report current position, dependencies, and blockers.

## Rule
- Do not advance past a phase whose gate is open or whose blocking review findings are unresolved.
`
}

function projectEngineSkill(): string {
  return `---
name: openrtl-project-engine
description: Manage the OpenRTL project engine: project metadata (openrtl-project.json), templates, tagging, roles/permissions, audit log, and multi-project workspaces.
---

# OpenRTL — Project Engine

## Metadata
- \`openrtl-project.json\` holds name, description, organization, team roles, permissions, lifecycle preset, tags, properties, dependencies, and the audit log path.

## Operations
- \`openrtl project list|create|clone|archive|tag|property|roles\`
- Templates scaffold from \`packages/openrtl/scaffold/templates/\`.
- Audit log is append-only at \`docs/00-project/audit.jsonl\`.

## Rules
- Project metadata is versioned and reviewed at phase 00.
- Role changes and permissions are audit-logged.
`
}

function toolchainSkill(): string {
  return `---
name: openrtl-toolchain
description: Operate the OpenRTL toolchain (open-source by default, commercial tools via adapters). Use to run synthesis, simulation, formal, timing, P&R, and firmware tooling through the uniform adapter interface.
---

# OpenRTL — Toolchain

## Uniform interface
- \`openrtl toolchain <tool> [args...]\` (or \`packages/openrtl/toolchain/flow.sh\`).

## Open-source (default)
yosys, nextpnr, verilator, iverilog, ghdl, cocotb, symbiyosys, opensta, openocd, renode, qemu, kicad, ngspice.

## Commercial (optional adapters)
vivado, quartus, libero — enabled only when \`OPENRTL_VENDOR_TOOLS=1\` and the tool is installed.

## Rules
- Prefer open-source flows; use vendor adapters only when required and available.
- Record tool versions in the phase toolchain context.
`
}

function visualizationSkill(): string {
  return `---
name: openrtl-visualization
description: Generate OpenRTL visualization artifacts: Mermaid and Graphviz files for system architecture, clock tree, task graph, traceability, coverage, power, and timing. Renders as static SVGs via CI.
---

# OpenRTL — Visualization

## Artifacts (docs/vis/)
- system.mmd, clock-tree.mmd, task-graph.dot, traceability.mmd, coverage.mmd, power.mmd, timing.mmd

## Procedure
1. Read the relevant phase context files.
2. Emit Mermaid (.mmd) and Graphviz (.dot) source.
3. A CI step renders SVG/PNG (mermaid-cli / graphviz) for docs.

## Rule
- Visualization reflects the phase context files; regenerate after phase updates.
`
}

function analyticsSkill(): string {
  return `---
name: openrtl-analytics
description: Generate the OpenRTL analytics report by parsing status.md, tasks, gates, and reviews across phases. Outputs docs/analytics/report.md + JSON covering productivity, coverage, quality, review stats, defect density, technical debt, risk, schedule, cost, power, area, performance.
---

# OpenRTL — Analytics

## Report (docs/analytics/report.md + report.json)
- Phase completion, gate pass rates, review findings, waivers, defect density, technical debt, risk score, schedule delta, cost/power/area/performance vs budget.

## Procedure
1. Scan all \`docs/<phase>/status.md\`, \`gates.md\`, and \`_reviews/*.md\`.
2. Aggregate metrics and write the report.
3. Flag deviations from requirements as risks.
`
}

function releaseSkill(): string {
  return `---
name: openrtl-release
description: Manage OpenRTL releases: versioning, milestones, snapshots/baselines, freeze, release candidates, hotfix/LTS planning, and the release review gate.
---

# OpenRTL — Release Management

## Model
- Version numbering (semver or custom), milestones, snapshots (git tags), baselines, freeze, candidates, hotfix, maintenance, LTS.

## Procedure
1. Create the release plan in \`docs/34-release/release-plan.md\`.
2. Cut the snapshot/baseline and freeze changes.
3. Run the release review gate (blocking findings resolved/waived).
4. Publish release notes and archive the release.
`
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

const ENGINEERS: { name: string; title: string; desc: string }[] = [
  { name: "system-architect", title: "System Architect", desc: "System architecture, partitioning, memory/bus, quantitative estimates." },
  { name: "market-analyst", title: "Market Analyst", desc: "Market sizing, personas, competition, pricing." },
  { name: "requirements-engineer", title: "Requirements Engineer", desc: "PRD/SRS/FRS, traceability, risk register." },
  { name: "fpga-selection-engineer", title: "FPGA Selection Engineer", desc: "FPGA/vendor trade study and part selection." },
  { name: "component-engineer", title: "Component Engineer", desc: "Component selection, BOM draft, AVL, lifecycle." },
  { name: "hardware-engineer", title: "Hardware Engineer", desc: "Hardware and PCB architecture, stackup, SI/PI." },
  { name: "power-engineer", title: "Power Engineer", desc: "Power architecture, estimation, sequencing." },
  { name: "clock-engineer", title: "Clock Engineer", desc: "Clock tree, domains, CDC, jitter budget." },
  { name: "reset-engineer", title: "Reset Engineer", desc: "Reset strategy, domains, deassertion synchronization." },
  { name: "security-engineer", title: "Security Engineer", desc: "Threat model, secure boot, crypto, tamper." },
  { name: "thermal-engineer", title: "Thermal Engineer", desc: "Thermal analysis and cooling strategy." },
  { name: "rtl-engineer", title: "RTL Engineer", desc: "RTL microarchitecture, coding standards, module implementation." },
  { name: "verification-engineer", title: "Verification Engineer", desc: "Verification plan, testbenches, UVM/cocotb." },
  { name: "formal-engineer", title: "Formal Verification Engineer", desc: "Formal properties, BMC, equivalence." },
  { name: "simulation-engineer", title: "Simulation Engineer", desc: "Regression, coverage closure, lint." },
  { name: "synthesis-engineer", title: "Synthesis Engineer", desc: "Synthesis flow, utilization." },
  { name: "pnr-engineer", title: "Place & Route Engineer", desc: "P&R, congestion, bitstream." },
  { name: "timing-engineer", title: "STA / Timing Engineer", desc: "Constraints, static timing analysis, closure." },
  { name: "optimization-engineer", title: "Optimization Engineer", desc: "Performance, power, area optimization." },
  { name: "debug-engineer", title: "Debug Engineer", desc: "Debug infrastructure, JTAG, instrumentation." },
  { name: "firmware-engineer", title: "Firmware Engineer", desc: "Firmware architecture, boot, HAL, diagnostics." },
  { name: "embedded-engineer", title: "Embedded Software Engineer", desc: "RTOS/Linux, drivers, FPGA software interface." },
  { name: "manufacturing-engineer", title: "Manufacturing Engineer", desc: "BOM, supply chain, assembly, traceability." },
  { name: "test-engineer", title: "Production Test Engineer", desc: "ATE, production test coverage, yield." },
  { name: "compliance-engineer", title: "Compliance Engineer", desc: "Certifications, EMI/EMC, materials." },
  { name: "docs-engineer", title: "Technical Writer", desc: "Engineering and product documentation." },
  { name: "release-manager", title: "Release Manager", desc: "Versioning, baselines, release review." },
  { name: "field-support-engineer", title: "Field Support Engineer", desc: "Field updates, telemetry, bug tracking, EOL." },
]

const SUPPORT_AGENTS: { name: string; title: string; desc: string }[] = [
  { name: "planner", title: "Planning Agent", desc: "Plans the workflow, schedules phases, identifies dependencies." },
  { name: "researcher", title: "Research Agent", desc: "Searches for technical, market, and tool information." },
  { name: "tool-integration", title: "Tool Integration Agent", desc: "Wires toolchain adapters and CI flows." },
  { name: "knowledge", title: "Knowledge Agent", desc: "Maintains project glossary and knowledge base." },
  { name: "memory", title: "Memory Agent", desc: "Tracks decisions, context, and continuity across phases." },
  { name: "reviewer", title: "Review Agent", desc: "Runs engineering reviews and records findings." },
  { name: "validator", title: "Validation Agent", desc: "Checks completion criteria, gates, and traceability." },
  { name: "risk", title: "Risk Agent", desc: "Maintains the risk register and flags risk events." },
]

function agentFile(name: string, title: string, desc: string, extra: string): string {
  return `---
description: OpenRTL ${title} — ${desc}
model: nvidia/deepseek-r1
tools:
  "*": true
---

You are the **${title}** on the OpenRTL FPGA/IC product-development team.

## Mission
${extra}

## Operating rules
- Work file-first: every output is written under \`docs/\` in the current OpenRTL project.
- Read the relevant phase README, status, gates, and task files before acting.
- Record required decisions in \`docs/00-project/decisions/\`.
- Never mark work done until it is verified, reviewed, and approved.
- Respect quality gates: if a gate is open or a blocking review finding is unresolved, report it instead of advancing.
`
}

function orchestratorFile(): string {
  return `---
description: Primary OpenRTL agent that orchestrates the full 36-phase FPGA/IC product-development lifecycle across all engineering, review, and project-management functions.
mode: primary
color: "#22d3ee"
model: nvidia/deepseek-r1
---

You are **OpenRTL**, the primary agent driving a complete, market-launch-ready FPGA/IC product from a description to production, using the opencode workspace as the engine.

## Operating principles
- **File-first context management.** Every phase writes to files under \`docs/\`. Never keep decisions only in the conversation.
- **Follow the 36 phases in order.** 00 Project, 01 Ideation, 02 Market, 03 Requirements, 04 Feasibility, 05 System Architecture, 06 Interface Definition, 07 FPGA Selection, 08 Component Selection, 09 Hardware Architecture, 10 PCB Architecture, 11 Power, 12 Clock, 13 Reset, 14 Security, 15 Thermal, 16 Software, 17 Firmware, 18 RTL Architecture, 19 Verification Plan, 20 Implementation, 21 Testbench, 22 Simulation, 23 Formal, 24 Synthesis, 25 P&R, 26 Timing, 27 Optimization, 28 Debug, 29 System Validation, 30 Manufacturing, 31 Production Test, 32 Compliance, 33 Documentation, 34 Release, 35 Field Support.
- **Never skip a phase or advance past an open gate.** Resolve or waive blocking findings first.
- **Delegate to engineers on demand** using the openrtl-* subagents and load the matching phase skill.
- **Enforce quality gates, reviews, and decisions** before closing each phase.

## Workflow
1. \`/openrtl\` starts or resumes. Load \`openrtl-init\` and \`openrtl-workflow\`.
2. Ask for the complete product description; store it in \`docs/00-project/project-description.md\`.
3. For each phase: load the phase skill + task manager, execute tasks, record decisions, run reviews, close the gate.
4. Stop at every user approval gate (ideation, requirements, architecture) and present files before continuing.
`
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const COMMANDS: { name: string; desc: string; body: string }[] = [
  {
    name: "openrtl",
    desc: "Start or continue the OpenRTL FPGA/IC product-development workflow.",
    body: `Start or continue the OpenRTL workflow.

1. Load the openrtl-init, openrtl-workflow, and openrtl-task-manager skills.
2. If no project description exists, ask the user for the complete product description and store it in docs/00-project/project-description.md.
3. Determine the current phase from docs/workflow/workflow.json and docs/tasks/index.md.
4. Execute the current phase: load its skill, run its 3-tier tasks, record decisions, run reviews, and close the quality gate.
5. Stop at user approval gates and present the generated files.
6. Report the next phase and any blocking findings.`,
  },
  {
    name: "openrtl-phase",
    desc: "Run a specific OpenRTL phase (e.g. /openrtl-phase 20-implementation).",
    body: `Execute a specific OpenRTL phase end-to-end.

1. Identify the requested phase id (e.g. 20-implementation) or the current pending phase.
2. Load the matching phase skill and openrtl-task-manager.
3. Read docs/<phase>/status.md, gates.md, and tasks/.
4. Execute every unchecked tier-3 step, writing outputs to the phase's context files.
5. Record required decisions and run the phase reviews.
6. Close the quality gate (or record an approved waiver); update status.md and the task index.`,
  },
  {
    name: "openrtl-tasks",
    desc: "Show the task breakdown / next pending task for a phase.",
    body: `Show the task breakdown and next pending action.

1. Load openrtl-task-manager.
2. If a phase id is given, list its tasks and current status; otherwise show the current phase and next pending task.
3. Report pending, in-progress, verified, reviewed, approved, and done states.`,
  },
  {
    name: "openrtl-review",
    desc: "Run an engineering review for a phase (or all), recording findings and blocking status.",
    body: `Run an OpenRTL engineering review.

1. Load the openrtl-review skill.
2. Determine the review types for the requested phase from its README (or run all reviews).
3. Load docs/_reviews/<type>-review.md and evaluate the phase context files.
4. Record findings with severity (block/non-block), owner, and verifier.
5. Blocking findings block the phase gate until resolved or waived; non-blocking create follow-up tasks.`,
  },
  {
    name: "openrtl-gate",
    desc: "Show or resolve a phase quality gate (pass/fail/waive).",
    body: `Evaluate or resolve an OpenRTL quality gate.

Usage: /openrtl-gate <phase-id> [criterion|all] --status <pass|fail|waive>

1. Load the openrtl-gate skill.
2. Read docs/<phase>/gates.md and evaluate each exit criterion.
3. Mark criteria pass/fail/waive based on evidence; a waiver requires an approved decision.
4. Report whether the phase may advance.`,
  },
  {
    name: "openrtl-decision",
    desc: "Create a decision-log / DDR entry.",
    body: `Create an OpenRTL decision-log entry.

1. Load the openrtl-decision skill.
2. Collect: decision, context/why, alternatives, trade-offs/impact, consequences, owner.
3. Write docs/00-project/decisions/DECISION-XXX.md with the next ID and update INDEX.md.
4. Route to review and approval; user sign-off where required.`,
  },
  {
    name: "openrtl-workflow",
    desc: "Manage the workflow engine (status/advance/resume/rollback).",
    body: `Manage the OpenRTL workflow engine.

Usage: /openrtl-workflow <status|advance|resume|rollback> [phase]

1. Load the openrtl-workflow skill.
2. Read docs/workflow/workflow.json.
3. status: report current phase, deps, gate, blockers.
4. advance: move to next runnable phase when deps satisfied + gate passed + reviews done.
5. resume: continue from the current phase.
6. rollback <phase>: re-open a phase for rework.`,
  },
  {
    name: "openrtl-project",
    desc: "Project engine: metadata, tags, roles, audit, templates.",
    body: `Manage the OpenRTL project engine.

Usage: /openrtl-project <metadata|tag|roles|audit|template> ...

1. Load the openrtl-project-engine skill.
2. metadata: show/edit openrtl-project.json.
3. tag: add tags/properties.
4. roles: update team roles and permissions (audit-logged).
5. template: list/apply project templates.`,
  },
  {
    name: "openrtl-vis",
    desc: "Generate visualization artifacts (Mermaid/Graphviz).",
    body: `Generate OpenRTL visualization artifacts.

1. Load the openrtl-visualization skill.
2. Read the relevant phase context files.
3. Emit Mermaid (.mmd) and Graphviz (.dot) into docs/vis/.
4. Trigger the CI render (SVG/PNG).`,
  },
  {
    name: "openrtl-analytics",
    desc: "Generate the analytics report (progress, quality, review, defect, risk).",
    body: `Generate the OpenRTL analytics report.

1. Load the openrtl-analytics skill.
2. Scan docs/<phase>/status.md, gates.md, and _reviews/.
3. Write docs/analytics/report.md + report.json.
4. Flag deviations as risks.`,
  },
  {
    name: "openrtl-release",
    desc: "Release management: version, baseline, freeze, release notes.",
    body: `Manage an OpenRTL release.

1. Load the openrtl-release skill.
2. Create/update the release plan in docs/34-release/release-plan.md.
3. Cut the snapshot/baseline (git tag) and freeze changes.
4. Run the release review gate; publish release notes.`,
  },
  {
    name: "openrtl-approve",
    desc: "Approve a phase, decision, review, or waiver.",
    body: `Approve an OpenRTL artifact.

Usage: /openrtl-approve <phase-id> | <decision-id> | review <type> | waiver <gate>

1. Record the approval in the relevant status/gates/decisions file with date and approver.
2. Unblock progression where appropriate.`,
  },
  {
    name: "openrtl-scaffold",
    desc: "Scaffold a new OpenRTL project.",
    body: `Scaffold a new OpenRTL project.

Usage: /openrtl-scaffold <name> [--preset full|fast-proto] [--desc "..."]

Run the scaffold tool with the provided options and report the created structure.`,
  },
]

// ---------------------------------------------------------------------------
// Write bundle
// ---------------------------------------------------------------------------

fs.rmSync(out, { recursive: true, force: true })
ensure(SKILL_DIR)
ensure(AGENT_DIR)
ensure(CMD_DIR)

for (const phase of PHASES) {
  write(path.join(SKILL_DIR, `openrtl-${phase.id}`, "SKILL.md"), phaseSkill(phase))
}

write(path.join(SKILL_DIR, "openrtl-init", "SKILL.md"), initSkill())
write(path.join(SKILL_DIR, "openrtl-task-manager", "SKILL.md"), taskManagerSkill())
write(path.join(SKILL_DIR, "openrtl-decision", "SKILL.md"), decisionSkill())
write(path.join(SKILL_DIR, "openrtl-gate", "SKILL.md"), gateSkill())
write(path.join(SKILL_DIR, "openrtl-review", "SKILL.md"), reviewSkill())
write(path.join(SKILL_DIR, "openrtl-workflow", "SKILL.md"), workflowSkill())
write(path.join(SKILL_DIR, "openrtl-project-engine", "SKILL.md"), projectEngineSkill())
write(path.join(SKILL_DIR, "openrtl-toolchain", "SKILL.md"), toolchainSkill())
write(path.join(SKILL_DIR, "openrtl-visualization", "SKILL.md"), visualizationSkill())
write(path.join(SKILL_DIR, "openrtl-analytics", "SKILL.md"), analyticsSkill())
write(path.join(SKILL_DIR, "openrtl-release", "SKILL.md"), releaseSkill())

write(path.join(AGENT_DIR, "openrtl.md"), orchestratorFile())
for (const a of [...ENGINEERS, ...SUPPORT_AGENTS]) {
  write(path.join(AGENT_DIR, `openrtl-${a.name}.md`), agentFile(a.name, a.title, a.desc, a.desc))
}

for (const c of COMMANDS) {
write(
  path.join(CMD_DIR, `${c.name}.md`),
  `---
description: ${c.desc}
subtask: true
---

${c.body}
`,
  )
}

write(
  path.join(out, "opencode.jsonc"),
  `{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "openrtl",
  "model": "nvidia/deepseek-v4-pro",
  "provider": {
    "nvidia": {
      "name": "NVIDIA NIM",
      "npm": "@ai-sdk/openai-compatible",
      "api": "https://integrate.api.nvidia.com/v1",
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1"
      },
      "env": ["NVIDIA_API_KEY"],
      "models": {
        "deepseek-v4-pro": { "id": "deepseek-ai/deepseek-v4-pro", "name": "DeepSeek V4 Pro (NVIDIA)" },
        "deepseek-v4-flash": { "id": "deepseek-ai/deepseek-v4-flash", "name": "DeepSeek V4 Flash (NVIDIA)" }
      }
    }
  },
  "skills": {
    "paths": ["./.opencode/skill"]
  }
}
`,
)

console.log(`Bundle generated at ${out}`)
console.log(`  skills:   ${fs.readdirSync(SKILL_DIR).length}`)
console.log(`  agents:   ${fs.readdirSync(AGENT_DIR).length}`)
console.log(`  commands: ${fs.readdirSync(CMD_DIR).length}`)
