---
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
