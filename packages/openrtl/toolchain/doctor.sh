#!/usr/bin/env bash
# =============================================================================
# OpenRTL — doctor.sh : toolchain health check
# -----------------------------------------------------------------------------
# Verifies every open-source EDA tool the workflow depends on, prints
# versions and PASS/FAIL per tool, and exits non-zero if anything required is
# missing. Used by flow.sh doctor and CI gates.
#
# Usage:  bash doctor.sh
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_YML="$SCRIPT_DIR/conda-env.yml"
MANIFEST="$SCRIPT_DIR/manifest.yaml"

PASS=0; FAIL=0; SKIP=0
say() { printf '\033[1;36m[openrtl]\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m  PASS\033[0m %s\n' "$*"; PASS=$((PASS+1)); }
bad() { printf '\033[1;31m  FAIL\033[0m %s\n' "$*"; FAIL=$((FAIL+1)); }
warn(){ printf '\033[1;33m  SKIP\033[0m %s\n' "$*"; SKIP=$((SKIP+1)); }

say "OpenRTL toolchain doctor"

# ------------------------------------------------------------ environment --
command -v python3 >/dev/null 2>&1 && ok "python3 $(python3 --version 2>&1 | cut -d' ' -f2)" || bad "python3"
if command -v conda >/dev/null 2>&1; then
  ok "conda"
else
  warn "conda (not required — system tools are fine)"
fi

# ------------------------------------------------------------- tool checks --
tool() {  # tool  cmd  version_flags  required:0/1
  local name="$1" cmd="$2" flags="$3" required="$4"
  if command -v "$cmd" >/dev/null 2>&1; then
    local ver
    ver="$($cmd $flags 2>&1 | head -1 | tr -s ' ' | cut -c1-80)"
    ok "$name ($ver)"
  elif [[ "$required" == "1" ]]; then
    bad "$name (missing)"
  else
    warn "$name (optional)"
  fi
}

tool "Yosys"        yosys            "--version"      1
tool "nextpnr-ice40" nextpnr-ice40  "--version"      1
tool "Icarus Verilog" iverilog      "-V"             1
tool "Verilator"    verilator       "--version"      1
tool "icepack"      icepack         "--version"      1
tool "icetime"      icetime         "--version"      1
tool "SymbiYosys"   sby             "--version"      0
tool "pytest"       pytest          "--version"      0
tool "zip"          zip             "--version"      0

# ----------------------------------------------------------- python pkgs ---
python3 - <<'PY' >/dev/null 2>&1
import cocotb  # noqa
PY
if [[ $? -eq 0 ]]; then ok "cocotb importable"; else warn "cocotb (optional, for cocotb sim)"; fi

# ---------------------------------------------------------------- summary --
echo ""
echo "  toolchain summary: PASS=$PASS FAIL=$FAIL SKIP=$SKIP"
[[ $FAIL -eq 0 ]]
