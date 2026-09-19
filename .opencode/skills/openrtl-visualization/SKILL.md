---
name: openrtl-visualization
description: Generate OpenRTL visualization artifacts: Mermaid and Graphviz files for system architecture, clock tree, task graph, traceability, coverage, power, and timing. Renders as static SVGs via CI.
---

# OpenRTL — Visualization

## Artifacts (docs/vis/)
- system.mmd, clock-tree.mmd, task-graph.dot, traceability.mmd, coverage.mmd, power.mmd, timing.mmd

## Automated infographics (report engine)
The report engine already renders dependency-free SVG infographics for every
measured phase — no manual charting needed:
- `python3 packages/openrtl/report/report.py all --project .`
  → `docs/<phase>/reports/*.svg` (resource-utilization, resource-mix,
  power-breakdown, quality-score, coverage, fmax, timing-closure)

## Procedure
1. Read the relevant phase context files.
2. Emit Mermaid (.mmd) and Graphviz (.dot) source for structural diagrams
   (architecture, clock tree, task graph, traceability).
3. A CI step renders SVG/PNG (mermaid-cli / graphviz) for docs.
4. For measured metrics (coverage, power, timing, resources) prefer the
   report engine SVGs over hand-drawn ones.

## Rule
- Visualization reflects the phase context files; regenerate after phase updates.
