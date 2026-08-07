// OpenRTL scaffold test.
// Scaffolds a throwaway project and verifies the expected structure exists.

import { execSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { PHASES } from "../scaffold/task-bank"

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "openrtl-test-"))
const name = "test-project"

console.log("Scaffolding test project in", tmp)
try {
  execSync(`bun run ${path.join(__dirname, "..", "scaffold", "scaffold.ts")} --dir ${tmp} --name ${name} --preset full`, {
    stdio: "inherit",
  })
} catch (e) {
  console.error("Scaffold failed:", e)
  process.exit(1)
}

const root = path.join(tmp, name)
let errors = 0
const check = (p: string, msg: string) => {
  if (!fs.existsSync(path.join(root, p))) {
    console.error("MISSING:", p, "—", msg)
    errors++
  }
}

// Root files
check("opencode.jsonc", "root config")
check("openrtl-project.json", "project metadata")
check("README.md", "readme")
check("docs/tasks/index.md", "task index")
check("docs/workflow/workflow.json", "workflow engine")
check("docs/00-project/decisions/INDEX.md", "decision log index")
check("docs/00-project/decisions/DECISION-000-template.md", "decision template")
check(".opencode/skill", "copied bundle skills")
check(".opencode/agent", "copied bundle agents")
check(".opencode/command", "copied bundle commands")

// All phases
let phaseCount = 0
let taskCount = 0
for (const phase of PHASES) {
  const dir = path.join(root, "docs", phase.id)
  if (!fs.existsSync(dir)) {
    console.error("  MISSING phase dir:", phase.id)
    errors++
    continue
  }
  phaseCount++
  check(`docs/${phase.id}/README.md`, "phase readme")
  check(`docs/${phase.id}/status.md`, "phase status")
  check(`docs/${phase.id}/gates.md`, "phase gates")
  taskCount += phase.tasks.length
}

// Reviews
check("docs/_reviews/requirements-review.md", "requirements review ticket")
check("docs/_reviews/architecture-review.md", "architecture review ticket")

console.log(`\nPhases: ${phaseCount}/${PHASES.length}  Tasks rendered: ${taskCount}`)
if (errors === 0) {
  console.log("PASS: scaffold structure valid.")
  fs.rmSync(tmp, { recursive: true, force: true })
} else {
  console.error(`FAIL: ${errors} missing items.`)
  process.exit(1)
}