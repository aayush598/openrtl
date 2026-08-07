---
name: openrtl-toolchain
description: Operate the OpenRTL toolchain (open-source by default, commercial tools via adapters). Use to run synthesis, simulation, formal, timing, P&R, and firmware tooling through the uniform adapter interface.
---

# OpenRTL — Toolchain

## Uniform interface
- `openrtl toolchain <tool> [args...]` (or `packages/openrtl/toolchain/flow.sh`).

## Open-source (default)
yosys, nextpnr, verilator, iverilog, ghdl, cocotb, symbiyosys, opensta, openocd, renode, qemu, kicad, ngspice.

## Commercial (optional adapters)
vivado, quartus, libero — enabled only when `OPENRTL_VENDOR_TOOLS=1` and the tool is installed.

## Rules
- Prefer open-source flows; use vendor adapters only when required and available.
- Record tool versions in the phase toolchain context.
