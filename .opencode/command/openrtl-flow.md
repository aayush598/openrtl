---
description: Run the unified open-source EDA pipeline (lint, sim, formal, synth, P&R, timing, power, coverage, verify, reports, handoff) in one step.
subtask: true
---

Run the full OpenRTL flow in one click using the unified driver.

Usage: /openrtl-flow [--top MODULE] [--arch ice40|ecp5|nexus|generic]

1. Load the openrtl-toolchain skill.
2. Run the pipeline:
   bash packages/openrtl/toolchain/flow.sh all --top <top> --arch <arch>
3. If `flow.sh all` is too heavy (no nextpnr/sby installed), run the
   available subset instead:
   bash packages/openrtl/toolchain/flow.sh doctor
   bash packages/openrtl/toolchain/flow.sh lint
   bash packages/openrtl/toolchain/flow.sh synth
   bash packages/openrtl/toolchain/flow.sh verify
   bash packages/openrtl/toolchain/flow.sh power
   bash packages/openrtl/toolchain/flow.sh reports
   bash packages/openrtl/toolchain/flow.sh handoff
4. Read the generated reports under docs/<phase>/reports/ and summarize:
   resource utilization, warnings, power, quality score.
5. Record tool versions + results in the phase toolchain context.
