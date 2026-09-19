/**
 * OpenRTL — scaffold.ts
 *
 * Generates a complete, workflow-ready OpenRTL project tree from a brief
 * product description. Every phase gets its status tracker, quality gates,
 * and context-file placeholders, so the autopilot agent has a stable,
 * discoverable structure to fill in.
 *
 * Usage:
 *   bun scaffold.ts --name alu4 \
 *       --desc "4-bit ALU with add, sub, logic ops, shift" \
 *       --top alu4 --arch ice40 --dir ./out
 *
 * Produces:
 *   <dir>/<name>/openrtl-project.json      metadata + lifecycle
 *   <dir>/<name>/docs/workflow/workflow.json
 *   <dir>/<name>/docs/00-project/...       project context
 *   <dir>/<name>/docs/<NN>-<phase>/status.md, gates.md, ctx/*.md
 *   <dir>/<name>/rtl/  tb/  formal/  constraints/  Makefile
 *   <dir>/<name>/.opencode/                agent + skills bundle
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// lifecycle definition (single source of truth — mirrors workflow.json)
// ---------------------------------------------------------------------------
interface PhaseDef {
  id: string;
  title: string;
  group: string;
  deps: string[];
  gate: string;        // review gate: architecture | implementation | timing | ops
  ctx: string[];       // context files (status trackers)
}

const PHASES: PhaseDef[] = [
  { id: "00-project", title: "Project", group: "define", deps: [], gate: "architecture", ctx: ["project-description", "toolchain", "README"] },
  { id: "01-ideation", title: "Ideation", group: "define", deps: ["00-project"], gate: "architecture", ctx: ["idea", "alignment"] },
  { id: "02-market", title: "Market", group: "define", deps: ["01-ideation"], gate: "architecture", ctx: ["market-analysis", "positioning"] },
  { id: "03-requirements", title: "Requirements", group: "define", deps: ["01-ideation", "02-market"], gate: "architecture", ctx: ["requirements"] },
  { id: "04-feasibility", title: "Feasibility", group: "define", deps: ["02-market", "03-requirements"], gate: "architecture", ctx: ["feasibility", "decisions"] },
  { id: "05-system-architecture", title: "System Architecture", group: "design", deps: ["03-requirements", "04-feasibility"], gate: "architecture", ctx: ["system-architecture"] },
  { id: "06-interface-definition", title: "Interface Definition", group: "design", deps: ["05-system-architecture"], gate: "architecture", ctx: ["interface"] },
  { id: "07-fpga-selection", title: "FPGA Selection", group: "design", deps: ["04-feasibility", "05-system-architecture"], gate: "architecture", ctx: ["fpga-selection", "decisions"] },
  { id: "08-component-selection", title: "Component Selection", group: "design", deps: ["07-fpga-selection"], gate: "architecture", ctx: ["components"] },
  { id: "09-hardware-architecture", title: "Hardware Architecture", group: "design", deps: ["05-system-architecture", "08-component-selection"], gate: "architecture", ctx: ["hardware-architecture"] },
  { id: "10-pcb-architecture", title: "PCB Architecture", group: "design", deps: ["09-hardware-architecture"], gate: "architecture", ctx: ["pcb-architecture"] },
  { id: "11-power-architecture", title: "Power Architecture", group: "design", deps: ["09-hardware-architecture"], gate: "architecture", ctx: ["power-architecture"] },
  { id: "12-clock-architecture", title: "Clock Architecture", group: "design", deps: ["05-system-architecture"], gate: "architecture", ctx: ["clock-architecture"] },
  { id: "13-reset-architecture", title: "Reset Architecture", group: "design", deps: ["05-system-architecture"], gate: "architecture", ctx: ["reset-architecture"] },
  { id: "14-security-architecture", title: "Security Architecture", group: "design", deps: ["05-system-architecture"], gate: "architecture", ctx: ["security-architecture"] },
  { id: "15-thermal-architecture", title: "Thermal Architecture", group: "design", deps: ["09-hardware-architecture", "10-pcb-architecture"], gate: "architecture", ctx: ["thermal-architecture"] },
  { id: "16-software-architecture", title: "Software Architecture", group: "design", deps: ["05-system-architecture"], gate: "architecture", ctx: ["software-architecture"] },
  { id: "17-firmware-architecture", title: "Firmware Architecture", group: "design", deps: ["16-software-architecture"], gate: "architecture", ctx: ["firmware-architecture"] },
  { id: "18-rtl-architecture", title: "RTL Architecture", group: "design", deps: ["05-system-architecture"], gate: "architecture", ctx: ["rtl-architecture", "decisions"] },
  { id: "19-verification-plan", title: "Verification Plan", group: "design", deps: ["03-requirements", "18-rtl-architecture"], gate: "architecture", ctx: ["verification-plan"] },
  { id: "20-implementation", title: "Implementation", group: "implement", deps: ["18-rtl-architecture"], gate: "implementation", ctx: ["rtl", "netlist-ref"] },
  { id: "21-testbench", title: "Testbench", group: "implement", deps: ["19-verification-plan", "20-implementation"], gate: "implementation", ctx: ["testbench", "tb"] },
  { id: "22-simulation", title: "Simulation", group: "verify", deps: ["19-verification-plan", "21-testbench"], gate: "timing", ctx: ["simulation", "coverage", "vcd"] },
  { id: "23-formal-verification", title: "Formal Verification", group: "verify", deps: ["19-verification-plan", "20-implementation"], gate: "timing", ctx: ["formal-properties", "sby"] },
  { id: "24-synthesis", title: "Synthesis", group: "implement", deps: ["20-implementation"], gate: "implementation", ctx: ["synthesis", "netlist", "resource", "inference", "warnings", "constraints", "optimization", "quality", "synth-reports"] },
  { id: "25-place-and-route", title: "Place and Route", group: "verify", deps: ["24-synthesis"], gate: "timing", ctx: ["pnr", "routing", "bitstream", "congestion", "timing-summary"] },
  { id: "26-timing-closure", title: "Timing Closure", group: "verify", deps: ["25-place-and-route"], gate: "timing", ctx: ["timing", "slack", "wns-tns", "fmax"] },
  { id: "27-optimization", title: "Optimization", group: "verify", deps: ["20-implementation", "24-synthesis"], gate: "timing", ctx: ["optimization", "area-freq", "improvements"] },
  { id: "28-debug", title: "Debug", group: "verify", deps: ["25-place-and-route", "22-simulation"], gate: "timing", ctx: ["debug-log", "root-cause"] },
  { id: "29-system-validation", title: "System Validation", group: "verify", deps: ["26-timing-closure", "28-debug", "23-formal-verification"], gate: "timing", ctx: ["validation", "quality"] },
  { id: "30-manufacturing", title: "Manufacturing", group: "produce", deps: ["10-pcb-architecture", "29-system-validation"], gate: "ops", ctx: ["bom", "assembly", "foundry"] },
  { id: "31-production-testing", title: "Production Testing", group: "produce", deps: ["30-manufacturing"], gate: "ops", ctx: ["test-plan", "fixtures"] },
  { id: "32-compliance", title: "Compliance", group: "produce", deps: ["29-system-validation", "30-manufacturing"], gate: "ops", ctx: ["compliance", "certification"] },
  { id: "33-documentation", title: "Documentation", group: "sustain", deps: ["29-system-validation"], gate: "ops", ctx: ["user-docs", "api-docs", "release-notes"] },
  { id: "34-release", title: "Release", group: "sustain", deps: ["29-system-validation", "33-documentation"], gate: "ops", ctx: ["release", "handoff"] },
  { id: "35-field-support", title: "Field Support", group: "sustain", deps: ["34-release"], gate: "ops", ctx: ["support", "obsolescence"] },
];

// ---------------------------------------------------------------------------
// arg parsing
// ---------------------------------------------------------------------------
interface Args {
  name: string;
  desc: string;
  top: string;
  arch: string;
  device: string;
  dir: string;
  author: string;
}
function parseArgs(argv: string[]): Args {
  const a = { name: "project", desc: "", top: "", arch: "ice40", device: "ice40up5k-sg48", dir: ".", author: "" } as Args;
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i], val = argv[i + 1];
    const set = (k: keyof Args, def: string) => { (a as any)[k] = val || def; i++; };
    if (key === "--name") set("name", "project");
    else if (key === "--desc") set("desc", "");
    else if (key === "--top") set("top", "");
    else if (key === "--arch") set("arch", "ice40");
    else if (key === "--device") set("device", "ice40up5k-sg48");
    else if (key === "--dir") set("dir", ".");
    else if (key === "--author") set("author", "");
    else if (key === "--help" || key === "-h") { console.log(usage()); process.exit(0); }
    else throw new Error(`unknown option: ${key}`);
  }
  return a;
}

function usage(): string {
  return `OpenRTL scaffold

  bun scaffold.ts --name <name> --desc "<product description>" [--top MODULE]
        [--arch ice40|ecp5|nexus|generic] [--device PART] [--dir DIR]

Generates a complete 36-phase OpenRTL project tree under <dir>/<name>/.`;
}

// ---------------------------------------------------------------------------
// file writers
// ---------------------------------------------------------------------------
function write(root: string, rel: string, content: string): void {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf-8");
}

function statusTemplate(phase: PhaseDef, ctx: string[]): string {
  const id = phase.id.slice(0, 2);
  return `# ${phase.title} — Status

> Phase \`${phase.id}\` · group **${phase.group}** · gate **${phase.gate}** · OpenRTL

## Phase progress

| Task | Title | Status | Completed |
| --- | --- | --- | --- |
| T${id}.1 | Define ${phase.title.toLowerCase()} scope | pending | — |
| T${id}.2 | Develop ${phase.title.toLowerCase()} details | pending | — |
| T${id}.3 | Review and pass quality gate | pending | — |

## Context files

${ctx.map((c) => `- [${c}](ctx/${c}.md)`).join("\n")}

## Gate

- [ ] All tasks complete and verified
- [ ] Mandatory review recorded
- [ ] User approval documented
- [ ] Context files archived

---
_OpenRTL · autopilot will fill this phase when scheduled._
`;
}

function gatesTemplate(phase: PhaseDef): string {
  const id = phase.id.slice(0, 2);
  const rows = phase.ctx.map((c) => `| ${c} finalized | no | OpenRTL agent | | |`).join("\n");
  return `# ${phase.title} — Quality Gate

> Phase \`${phase.id}\` · exit criteria that block progression until satisfied.

## Gate criteria

| Criterion | Met | Owner | Verified | Waived | Waive reason |
| --- | --- | --- | --- | --- | --- |
| All T${id} tasks completed | no | OpenRTL agent | | | |
${rows}

## Blocking rule

- Progression to the next phase is **blocked** until every criterion is met
  or explicitly waived and recorded by the user.
- This gate belongs to group **${phase.group}** (review: ${phase.gate}).
`;
}

function ctxTemplate(phase: PhaseDef, name: string): string {
  return `# ${name} — ${phase.title}

> Phase \`${phase.id}\` · context file · OpenRTL

_Content pending — this file is filled by the autopilot during phase ${phase.id}._
`;
}

function projectJson(a: Args): string {
  return JSON.stringify({
    name: a.name,
    description: a.desc,
    top: a.top || a.name,
    arch: a.arch,
    device: a.device,
    author: a.author,
    schema: "openrtl/project-schema@1",
    lifecycle: { phases: PHASES.length, groups: ["define", "design", "implement", "verify", "produce", "sustain"] },
    toolchain: "packages/openrtl/toolchain/manifest.yaml",
    updatedAt: new Date().toISOString(),
  }, null, 2) + "\n";
}

function workflowJson(a: Args): string {
  return JSON.stringify({
    schema: "openrtl/workflow@1",
    name: a.name,
    top: a.top || a.name,
    arch: a.arch,
    device: a.device,
    mode: "sequential",
    gates: { architecture: "review", implementation: "review", timing: "blocking", ops: "blocking" },
    phases: PHASES.map((p) => ({ id: p.id, title: p.title, group: p.group, depends: p.deps, gate: p.gate })),
  }, null, 2) + "\n";
}

function makefile(a: Args): string {
  return `# ${a.name} — OpenRTL Makefile
# Top-level targets wrap the unified flow driver.
TOP := ${a.top || a.name}
ARCH := ${a.arch}
FLOW := bash ${"$(OPENRTL_DIR:-packages/openrtl)/toolchain/flow.sh"}

.PHONY: doctor lint sim formal synth pnr timing power coverage verify reports handoff all

doctor:   ; ${"$(FLOW)"} doctor
lint:     ; ${"$(FLOW)"} lint --top ${"$(TOP)"} --arch ${"$(ARCH)"}
sim:      ; ${"$(FLOW)"} sim --top ${"$(TOP)"}
formal:   ; ${"$(FLOW)"} formal --top ${"$(TOP)"}
synth:    ; ${"$(FLOW)"} synth --top ${"$(TOP)"} --arch ${"$(ARCH)"}
pnr:      ; ${"$(FLOW)"} pnr --top ${"$(TOP)"} --arch ${"$(ARCH)"}
timing:   ; ${"$(FLOW)"} timing --top ${"$(TOP)"}
power:    ; ${"$(FLOW)"} power --top ${"$(TOP)"}
coverage: ; ${"$(FLOW)"} coverage --top ${"$(TOP)"}
verify:   ; ${"$(FLOW)"} verify --top ${"$(TOP)"}
reports:  ; ${"$(FLOW)"} reports --top ${"$(TOP)"}
handoff:  ; ${"$(FLOW)"} handoff --top ${"$(TOP)"}
all:      ; ${"$(FLOW)"} all --top ${"$(TOP)"} --arch ${"$(ARCH)"}
`;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main(): void {
  const a = parseArgs(process.argv.slice(2));
  const root = resolve(join(a.dir, a.name));
  if (existsSync(root) && (existsSync(join(root, "openrtl-project.json")) || existsSync(join(root, "docs")))) {
    console.error(`[scaffold] target already exists: ${root}`);
    process.exit(1);
  }
  mkdirSync(join(root, "rtl"), { recursive: true });
  mkdirSync(join(root, "tb"), { recursive: true });
  mkdirSync(join(root, "formal"), { recursive: true });
  mkdirSync(join(root, "constraints"), { recursive: true });
  mkdirSync(join(root, "build"), { recursive: true });

  write(root, "openrtl-project.json", projectJson(a));
  write(root, "docs/workflow/workflow.json", workflowJson(a));

  // 00-project context
  write(root, "docs/00-project/status.md", statusTemplate(PHASES[0], PHASES[0].ctx));
  write(root, "docs/00-project/gates.md", gatesTemplate(PHASES[0]));
  write(root, "docs/00-project/ctx/project-description.md",
    `# Project Description — ${a.name}\n\n> Phase \`00-project\` · OpenRTL\n\n${a.desc}\n`);
  write(root, "docs/00-project/ctx/toolchain.md",
    `# Toolchain — ${a.name}\n\n> Phase \`00-project\` · OpenRTL\n\nOpen-source toolchain. Verify with \`flow.sh doctor\`, install with \`provision.sh\`.\n`);
  write(root, "docs/00-project/ctx/README.md", `# ${a.name}\n\n${a.desc}\n\nOpenRTL project · open-source toolchain.\n`);

  // remaining phases
  for (const p of PHASES.slice(1)) {
    write(root, `docs/${p.id}/status.md`, statusTemplate(p, p.ctx));
    write(root, `docs/${p.id}/gates.md`, gatesTemplate(p));
    for (const c of p.ctx) {
      write(root, `docs/${p.id}/ctx/${c}.md`, ctxTemplate(p, c));
    }
  }

  // decisions + task index
  mkdirSync(join(root, "docs/00-project/decisions"), { recursive: true });
  write(root, "docs/00-project/decisions/README.md",
    `# Decisions\n\n> Phase \`00-project\` · decision log (ADRs). Key decisions that affect ${a.name}.\n`);
  write(root, "docs/tasks/index.md",
    `# Task Index\n\n> OpenRTL 3-tier task tracker · generated by scaffold.\n\n| Task | Phase | Title | Status |\n| --- | --- | --- | --- |\n`);

  // code scaffolding placeholders
  write(root, "rtl/.gitkeep", "");
  write(root, "tb/.gitkeep", "");
  write(root, "formal/.gitkeep", "");
  write(root, "Makefile", makefile(a));
  write(root, ".gitignore", "build/\n*.o\n*.d\nobj_dir/\n");
  write(root, "README.md", `# ${a.name}\n\n${a.desc}\n\nOpenRTL project — 36-phase lifecycle, open-source toolchain (${a.arch}/${a.device}).\n`);

  console.log(`[scaffold] project created at ${root}`);
  console.log(`[scaffold] ${PHASES.length} phases · top=${a.top || a.name} · arch=${a.arch}`);
  console.log(`[scaffold] run: flow.sh doctor   then: flow.sh all`);
}

main();
