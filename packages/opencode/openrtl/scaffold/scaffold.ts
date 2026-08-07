// OpenRTL project scaffold
// Generates the complete OpenRTL project structure:
//  - docs/<phase>/ folders for all 36 phases
//  - 3-tier task files (docs/<phase>/tasks/<task-id>.md) with epic/microtask hierarchy
//  - quality-gate files (gates.md) with exit criteria and waiver tracking
//  - decision log / DDRs (docs/00-project/decisions/)
//  - engineering review tickets (docs/_reviews/)
//  - project metadata (project-schema.json), workflow config, visualization + analytics stubs
//  - project opencode.jsonc + .opencode/ bundle
//
// Usage:
//   bun run scaffold.ts --name <project-name> [--dir <parent-dir>] [--desc "desc"] [--preset full|fast-proto]

import { PHASES, phaseInPreset, REVIEWS, type Phase, type Preset } from "./task-bank"
import path from "path"
import fs from "fs"

const args = process.argv.slice(2)

function argValue(name: string): string | undefined {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const projectName = argValue("--name") ?? "openrtl-project"
const parentDir = argValue("--dir") ?? process.cwd()
const description = argValue("--desc") ?? ""
const preset: Preset = (argValue("--preset") as Preset) ?? "full"

function sanitize(s: string): string {
  return s.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
}

function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function activePhases(): Phase[] {
  return PHASES.filter((p) => phaseInPreset(p, preset))
}

// ---------------------------------------------------------------------------
// File generators
// ---------------------------------------------------------------------------

function phaseReadme(phase: Phase): string {
  const taskLines = phase.tasks
    .map((t) => `- [ ] **${t.id} — ${t.title}**: ${t.objective}`)
    .join("\n")
  const files = phase.contextFiles.map((f) => `- \`${f}\``).join("\n")
  const gates = phase.gates.map((g) => `- [ ] ${g}`).join("\n")
  const decisions = phase.decisions.map((d) => `- ${d}`).join("\n")
  const reviews = phase.reviews.map((r) => `- \`${r}\` — ${REVIEWS[r].title}`).join("\n")
  return `# ${phase.name}

> Phase: \`${phase.id}\` · OpenRTL · group: \`${phase.group}\` · preset: \`${preset}\`

## Description
${phase.description}

## Depends on
${phase.dependsOn.length ? phase.dependsOn.map((d) => `- \`${d}\``).join("\n") : "- (none — entry phase)"}

## Tasks
${taskLines}

## Quality gate (exit criteria)
${gates}

## Required engineering reviews
${reviews}

## Decisions to log
${decisions}

## Context files (produced/consumed in this phase)
${files}

## Status
See [status.md](./status.md), [gates.md](./gates.md) and [tasks/](./tasks/).
`
}

function taskFile(phase: Phase, task: Phase["tasks"][number]): string {
  const lines: string[] = []
  lines.push(`# ${task.id} — ${task.title}`)
  lines.push("")
  lines.push(`> Phase: \`${phase.id}\` (${phase.name}) · OpenRTL 3-tier task`)
  lines.push("")
  lines.push("## Objective")
  lines.push(task.objective)
  lines.push("")
  lines.push("## Tier-2 subtasks and tier-3 steps")
  lines.push("")
  task.subtasks.forEach((subtask, i) => {
    lines.push(`### S${i + 1} — ${subtask.title}`)
    lines.push("")
    subtask.steps.forEach((step) => lines.push(`- [ ] ${step}`))
    lines.push("")
  })
  lines.push("## Task engine")
  lines.push("- Epic: see docs/00-project epics")
  lines.push("- Ver:  [ ] completion criteria met")
  lines.push("- Rev:  [ ] reviewed")
  lines.push("- Appr: [ ] approved")
  lines.push("- Done: [ ] marked done only when verified + reviewed + approved")
  lines.push("")
  lines.push("## Inputs (context files to read)")
  lines.push(`- \`docs/${phase.id}/\` phase context files`)
  lines.push("- Project description and prior-phase outputs")
  lines.push("")
  lines.push("## Outputs (files to produce/update)")
  lines.push(`- Phase artifacts under \`docs/${phase.id}/\``)
  lines.push("- Updated status.md and gates.md for this phase")
  lines.push("")
  lines.push("## Verification (complete only when all checkboxes pass)")
  lines.push("- [ ] Every tier-3 step above is checked and actually implemented in the output files")
  lines.push("- [ ] Any leftover/incomplete step has a follow-up task created")
  lines.push("- [ ] User review performed for this task")
  lines.push("")
  lines.push("## Status")
  lines.push("pending")
  lines.push("")
  return lines.join("\n")
}

function gatesFile(phase: Phase): string {
  const lines: string[] = []
  lines.push(`# ${phase.name} — Quality Gate`)
  lines.push("")
  lines.push(`> Phase: \`${phase.id}\` · Exit criteria that block progression until satisfied or explicitly waived.`)
  lines.push("")
  lines.push("## Gate status")
  lines.push("")
  lines.push("| Criterion | Status | Owner | Verified | Waived | Waive reason |")
  lines.push("| --- | --- | --- | --- | --- | --- |")
  for (const g of phase.gates) {
    lines.push(`| ${g.replace(/\|/g, "/")} | pending | | | | |`)
  }
  lines.push("")
  lines.push("## Rule")
  lines.push("- Progression to the next phase is **blocked** until all criteria pass (Status = pass) or are explicitly waived and recorded.")
  lines.push("- Waivers must be approved and logged in the decision log.")
  lines.push("- Reset a criterion with: \`/openrtl-gate ${phase.id} <id|all> --status <pass|fail|waive>\`.")
  lines.push("")
  return lines.join("\n")
}

function decisionTemplate(): string {
  return `# DECISION-XXX — Title

> Status: proposed · Owner: · Date:

## Decision
What we decided.

## Context / Why
Background and drivers.

## Alternatives considered
- Alt A — trade-offs
- Alt B — trade-offs

## Trade-offs / Impact
- Cost / performance / power / risk / schedule impact.

## Consequences
What follows from this decision.

## Review
- [ ] Reviewed
- [ ] Approved
- [ ] Approved by user
`
}

function reviewFile(reviewKey: string, phaseIds: string[]): string {
  const meta = REVIEWS[reviewKey as keyof typeof REVIEWS] ?? { title: reviewKey, description: "" }
  const lines: string[] = []
  lines.push(`# ${meta.title}`)
  lines.push("")
  lines.push(`> Type: \`${reviewKey}\` · Status: pending · Phases: ${phaseIds.join(", ") || "-"}`)
  lines.push("")
  lines.push("## Objective")
  lines.push(meta.description)
  lines.push("")
  lines.push("## Findings")
  lines.push("")
  lines.push("| ID | Finding | Severity | Owner | Verifier | Resolved | Date |")
  lines.push("| --- | --- | --- | --- | --- | --- | --- |")
  lines.push("| | | | | | | |")
  lines.push("")
  lines.push("## Rule")
  lines.push("- Progression is blocked until every **block** finding is resolved or waived.")
  lines.push("- Waivers must be approved and recorded in the decision log.")
  lines.push("")
  return lines.join("\n")
}

function statusFile(phase: Phase): string {
  const lines: string[] = []
  lines.push(`# ${phase.name} — Status`)
  lines.push("")
  lines.push(`> Phase: \`${phase.id}\` · OpenRTL`)
  lines.push("")
  lines.push("## Phase progress")
  lines.push("")
  lines.push("| Task | Title | Status | Completed |")
  lines.push("| --- | --- | --- | --- |")
  for (const t of phase.tasks) {
    lines.push(`| ${t.id} | ${t.title} | pending | |`)
  }
  lines.push("")
  lines.push("## Phase gate")
  lines.push("- [ ] All tasks complete and verified")
  lines.push("- [ ] Quality gate exit criteria met (see gates.md)")
  lines.push("- [ ] Mandatory reviews completed")
  lines.push("- [ ] User approval recorded")
  lines.push("- [ ] Context files finalized")
  lines.push("")
  return lines.join("\n")
}

function placeholderContextFile(phaseName: string, relPath: string): string {
  const name = path.basename(relPath, ".md").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return `# ${name}

> Phase: ${phaseName} · OpenRTL

_(Placeholder generated by the OpenRTL scaffold. Complete it in the ${phaseName} phase following the OpenRTL skills and the 3-tier task files under \`tasks/\`.)_

## Status
pending
`
}

function projectMetadata(name: string, desc: string): string {
  return JSON.stringify(
    {
      schema: "openrtl/project-schema@1",
      name,
      description: desc || "FPGA / IC product developed with OpenRTL",
      organization: "",
      team: { roles: { owner: "", leads: [], engineers: [] } },
      permissions: { model: "organization/team/roles", roles: ["owner", "lead", "engineer", "reviewer", "viewer"] },
      lifecycle: { preset: preset, phases: activePhases().length, groups: ["define", "design", "implement", "verify", "produce", "sustain"] },
      tags: [],
      properties: {},
      dependencies: {},
      auditLog: "docs/00-project/audit.jsonl",
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

function stageOverview(): string {
  const lines: string[] = []
  lines.push("# OpenRTL — Phase Overview")
  lines.push("")
  lines.push(`This project follows the OpenRTL lifecycle (preset: **${preset}**, ${activePhases().length} active phases of ${PHASES.length}). Each phase has its folder with context files, a 3-tier task breakdown, a quality gate, and reviews.`)
  lines.push("")
  lines.push("| Phase | Name | Group | Progress | Gate |")
  lines.push("| --- | --- | --- | --- | --- |")
  for (const p of activePhases()) {
    lines.push(`| \`${p.id}\` | ${p.name} | ${p.group} | pending | [gates](./${p.id}/gates.md) |`)
  }
  lines.push("")
  lines.push("## Task index")
  lines.push("")
  for (const p of activePhases()) {
    lines.push(`### ${p.id} — ${p.name}`)
    lines.push("")
    for (const t of p.tasks) {
      lines.push(`- [ ] [${t.id} — ${t.title}](./${p.id}/tasks/${t.id}.md)`)
    }
    lines.push("")
  }
  lines.push("## Workflow commands")
  lines.push("- \`/openrtl\` — start / continue the OpenRTL workflow")
  lines.push("- \`/openrtl-phase <id>\` — run a specific phase")
  lines.push("- \`/openrtl-tasks [id]\` — show task breakdown / next task")
  lines.push("- \`/openrtl-review <id>\` — verify a phase/task complete")
  lines.push("- \`/openrtl-gate <id>\` — show/resolve a phase quality gate")
  lines.push("- \`/openrtl-decision\` — new decision log / DDR entry")
  lines.push("- \`/openrtl-workflow\` — manage the workflow engine")
  lines.push("- \`/openrtl-project\` — project engine (metadata/tags/roles)")
  lines.push("- \`/openrtl-vis\` — generate visualization artifacts")
  lines.push("- \`/openrtl-analytics\` — generate analytics report")
  lines.push("- \`/openrtl-release\` — release management")
  lines.push("")
  return lines.join("\n")
}

function workflowEngine(name: string): string {
  return JSON.stringify(
  {
    name,
    preset,
    mode: "sequential",
    supported: ["sequential", "parallel", "conditional", "dag"],
    steps: activePhases().map((p) => ({
      id: p.id,
      depends: p.dependsOn,
      gate: "blocking",
      review: p.reviews,
    })),
    notes: "Logical DAG expressed here; actual parallel execution is limited by agent turn ordering. Resume via status/gates files.",
  },
    null,
    2,
  )
}

function projectReadme(name: string, desc: string): string {
  const stages = activePhases()
    .map((s) => `- [${s.id}] ${s.name} — [README](docs/${s.id}/README.md)`)
    .join("\n")
  return `# ${name}

${desc || "FPGA / IC product developed with OpenRTL."}

## OpenRTL lifecycle
See [docs/tasks/index.md](./docs/tasks/index.md) for the full 3-tier task breakdown across all ${activePhases().length} active phases.

## Quick start
1. Run \`openrtl\` in this directory (or \`opencode\` — the OpenRTL bundle is loaded from \`.opencode/\`).
2. Type \`/openrtl\` to start the workflow.
3. Provide the complete project description when asked.
4. Review each generated context file at the approval gates.

## Reset preset
Run with a different preset: \`openrtl new <name> --preset fast-proto\` (skips market/formal/manufacturing-heavy phases).

## Phases
${stages}
`
}

function projectGitignore(): string {
  return `# OpenRTL
.env
*.log
build/
bitstreams/
*.jou
.vivado/
.settings/
__pycache__/
docs/_reviews/
`
}

function projectConfig(): string {
  return `{
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
        "deepseek-v4-pro": {
          "id": "deepseek-ai/deepseek-v4-pro",
          "name": "DeepSeek V4 Pro (NVIDIA)"
        },
        "deepseek-v4-flash": {
          "id": "deepseek-ai/deepseek-v4-flash",
          "name": "DeepSeek V4 Flash (NVIDIA)"
        }
      }
    }
  },
  "skills": {
    "paths": ["./.opencode/skill"]
  }
}
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const safeName = sanitize(projectName)
const projectDir = path.join(parentDir, safeName)

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true })
}
function writeFile(p: string, content: string) {
  ensureDir(path.dirname(p))
  fs.writeFileSync(p, content)
}

// Resolve the OpenRTL bundle dir. In the consolidated opencode workspace the
// bundle lives alongside this scaffold tool (same package), so derive it here.
const bundleDir = path.resolve(path.join(__dirname, "..", "bundle"))

function copyDir(s: string, d: string) {
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const sFull = path.join(s, entry.name)
    const dFull = path.join(d, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(dFull, { recursive: true })
      copyDir(sFull, dFull)
    } else {
      fs.mkdirSync(path.dirname(dFull), { recursive: true })
      fs.copyFileSync(sFull, dFull)
    }
  }
}

function copyBundle(target: string) {
  for (const sub of ["skill", "agent", "command"]) {
    const s = path.join(bundleDir, sub)
    if (fs.existsSync(s)) copyDir(s, path.join(target, ".opencode", sub))
  }
}

console.log(`OpenRTL scaffold: creating project "${safeName}" (preset: ${preset}) in ${projectDir}`)

// Root files
writeFile(path.join(projectDir, "README.md"), projectReadme(safeName, description))
writeFile(path.join(projectDir, ".gitignore"), projectGitignore())
writeFile(path.join(projectDir, "opencode.jsonc"), projectConfig())

// Project metadata + project description
writeFile(path.join(projectDir, "openrtl-project.json"), projectMetadata(safeName, description) || "{}")
writeFile(
  path.join(projectDir, "docs", "00-project", "project-description.md"),
  `# Project Description\n\n${description || "_To be filled by the user in the Ideation phase._"}\n\n## Status\npending\n`,
)

// Decision log + DDR template
writeFile(path.join(projectDir, "docs", "00-project", "decisions", "INDEX.md"), "# Decision Log\n\n| ID | Title | Status | Date |\n| --- | --- | --- | --- |\n|\n")
writeFile(path.join(projectDir, "docs", "00-project", "decisions", "DECISION-000-template.md"), decisionTemplate())

// Workflow engine
writeFile(path.join(projectDir, "docs", "workflow", "workflow.json"), workflowEngine(safeName))

// Copy the OpenRTL bundle into .opencode/
copyBundle(projectDir)

// Phase folders
for (const phase of activePhases()) {
  const phaseDir = path.join(projectDir, "docs", phase.id)
  writeFile(path.join(phaseDir, "README.md"), phaseReadme(phase))
  writeFile(path.join(phaseDir, "status.md"), statusFile(phase))
  writeFile(path.join(phaseDir, "gates.md"), gatesFile(phase))
  for (const task of phase.tasks) {
    writeFile(path.join(phaseDir, "tasks", `${task.id}.md`), taskFile(phase, task))
  }
  for (const file of phase.contextFiles) {
    if (file.endsWith("/")) continue
    if (path.extname(file) !== ".md") continue
    const relative = file.startsWith(`${phase.id}/`) ? file.slice(phase.id.length + 1) : file
    writeFile(path.join(phaseDir, relative), placeholderContextFile(phase.name, relative))
  }
}

// Review tickets (per review type across all phases)
const byReview = new Map<string, string[]>()
for (const p of activePhases()) for (const r of p.reviews) byReview.set(r, [...(byReview.get(r) ?? []), p.id])
for (const [reviewType, phaseIds] of byReview) {
  writeFile(path.join(projectDir, "docs", "_reviews", `${reviewType}-review.md`), reviewFile(reviewType, phaseIds))
}

// Task index
writeFile(path.join(projectDir, "docs", "tasks", "index.md"), stageOverview())

console.log("")
console.log(`OpenRTL project scaffolded at: ${projectDir}`)
console.log("")
console.log("Next steps:")
console.log(`  1. cd ${projectDir}`)
console.log(`  2. configure a model provider in opencode.jsonc (API key in .env)`)
console.log(`  3. openrtl   (or: opencode — bundle auto-loaded from .opencode/)`)
console.log(`  4. Type /openrtl in the TUI to start the workflow.`)
console.log("")