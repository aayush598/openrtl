# Report engine

Zero-dependency Python that turns raw tool output into publishable Markdown
reports and SVG infographics. No third-party packages — only Python 3.8+.

```bash
python3 report/report.py <section> [--project DIR] [--top MODULE]
                                 [--arch ARCH] [--out DIR] [--activity 0.5]
```

## Sections

| Section    | Phase directory          | Content |
|------------|--------------------------|---------|
| `synth`    | `24-synthesis`           | netlist, resource analysis, device budget, inference, warnings, constraints, optimization, quality |
| `pnr`      | `25-place-and-route`     | routing result, bitstream, I/O & device |
| `timing`   | `26-timing-closure`      | target vs achieved fmax, slack, MET/VIOLATED |
| `power`    | `24-synthesis`           | toggle-based power estimate + breakdown |
| `coverage` | `22-simulation`          | statement/toggle coverage vs the 90% gate |
| `formal`   | `23-formal-verification` | engine runs, proven/counter-example/error |
| `sim`      | `22-simulation`          | cocotb/pytest pass/fail/skip summary |
| `quality`  | `29-system-validation`   | composite quality score across flows |
| `all`      | all of the above         | every section + an index |
| `handoff`  | `34-release`             | zip reports + netlist + bitstream |

Every section degrades gracefully to `pending` when artifacts are missing,
so reports can be generated at any point in the flow.

## Parsers

`report.py` includes tolerant parsers for real tool output:

- `parse_yosys_stat` — both stat line orientations (`45 SB_LUT4` and the
  `Number of cells:` block with `SB_LUT4 45`)
- `parse_resource_summary` — wires/bits/ports/memories/processes
- `parse_inference` / `parse_warnings` — yosys pass names and warnings
- `parse_sdc` / `clock_period_ns` — SDC constraints → clock period
- `parse_pnr_log` / `parse_icetime` — routing, fmax, congestion, delays
- `netlist_cell_stats` — cell counts from yosys `write_json` output
- `coverage_stats` — Verilator `coverage.dat` (`C<count>\t…` format)
- `pytest_stats` — cocotb/pytest logs and `results.xml`

## Power model

Toggle-based estimate:

```
P = Σ(per cell) C_eff · Vdd² · f_clk · α
```

Only physical/hardware cells are counted (`SB_*`, `LUT`, `FD*`, `CARRY`,
`SB_RAM40_4K`, …); Yosys-internal cells (`$scopeinfo`, `$logic_*`) are
excluded so the number reflects real switching resources. Per-cell
capacitance estimates, supply voltage per architecture (ice40 1.2 V, ecp5
1.1 V, nexus 1.0 V), default α = 0.5. Static/leakage power is not modeled —
see the methodology note in the report.

## Device budget

`DEVICE_BUDGET` holds approximate fabric capacities per architecture/device
(ice40, ecp5, nexus). The `synth` section renders a utilization table
(used / available / %) and a LUT-utilization gauge, reading the device from
`openrtl-project.json` (e.g. `ice40up5k-sg48`).

## Quality scoring

`quality_score()` returns 0–100 across five weighted criteria:

| Criterion                    | Weight |
|------------------------------|--------|
| Netlist synthesized          | 25     |
| P&R converged                | 20     |
| Timing closure (fmax ≥ target) | 20   |
| Coverage ≥ 90%               | 20     |
| No critical warnings         | 15     |

Verdict: `PASS` ≥ 80, `REVIEW` 50–79, `FAIL` < 50.

## SVG infographics

`report/svg.py` renders dependency-free charts: bar, horizontal bar, stacked
bar, donut, line, gauge, histogram. All output is valid XML; empty data
renders a `No data` placeholder instead of crashing.
