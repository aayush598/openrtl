#!/usr/bin/env bash
#
# OpenRTL toolchain launcher.
# Provides a uniform CLI for both open-source tools and (optional) commercial
# vendor tools. OpenRTL skills call this with a tool name; commercial tools are
# used only when their adapter is enabled and the tool is installed.
#
# Usage:
#   flow.sh <tool> [args...]
#
# Tools: yosys nextpnr verilator iverilog ghdl cocotb symbiyosys opensta
#        vivado quartus libero openocd renode qemu kicad ngspice

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTER_DIR="$SCRIPT_DIR/adapters"

tool="${1:-}"
shift || true

resolve() {
  if command -v "$1" >/dev/null 2>&1; then
    echo "FOUND:$1:$(command -v "$1")"
    return 0
  fi
  echo "MISSING:$1"
  return 1
}

case "$tool" in
  "" | help | --help | -h)
    echo "usage: openrtl toolchain <tool> [args...]"
    echo ""
    echo "open-source: yosys nextpnr verilator iverilog ghdl cocotb symbiyosys opensta"
    echo "             openocd renode qemu kicad ngspice"
    echo "commercial (adapter, only if installed): vivado quartus libero"
    echo ""
    echo "Run 'openrtl toolchain <tool> --probe' to check availability."
    ;;

  --probe)
    echo "== OpenRTL toolchain probe =="
    for t in yosys nextpnr verilator iverilog ghdl cocotb symbiyosys opensta openocd renode qemu kicad ngspice; do
      resolve "$t" || true
    done
    for t in vivado quartus libero; do
      if [[ -n "${OPENRTL_VENDOR_TOOLS:-}" ]]; then
        resolve "$t" || true
      else
        echo "SKIP:$t (commercial; set OPENRTL_VENDOR_TOOLS=1 to probe)"
      fi
    done
    ;;

  yosys | nextpnr | verilator | iverilog | ghdl | symbiyosys | opensta | openocd | renode | qemu | kicad | ngspice)
    resolve "$tool" && exec "$(command -v "$tool")" "$@"
    echo "error: $tool not installed" >&2
    exit 1
    ;;

  cocotb)
    # cocotb runs through python -m
    if python3 -c "import cocotb" >/dev/null 2>&1; then
      echo "FOUND:cocotb:$(python3 -c 'import cocotb; print(cocotb.__file__)')"
      exec python3 -m cocotb "$@"
    fi
    echo "error: cocotb not installed (pip install cocotb)" >&2
    exit 1
    ;;

  vivado | quartus | libero)
    adapter="$ADAPTER_DIR/$tool.sh"
    if [[ -n "${OPENRTL_VENDOR_TOOLS:-}" ]] && [[ -x "$adapter" ]]; then
      exec "$adapter" "$@"
    fi
    echo "error: commercial tool '$tool' disabled. Set OPENRTL_VENDOR_TOOLS=1 and provide an adapter at $adapter" >&2
    exit 1
    ;;

  flow)
    echo "Generic open-source FPGA flow (yosys -> nextpnr)."
    echo "Usage: flow.sh flow --top <TOP> --files 'a.v b.sv' --fpga <part>"
    echo "Not yet wired; see docs/guides/toolchain.md"
    ;;

  *)
    echo "error: unknown tool '$tool'" >&2
    exit 1
    ;;
esac