#!/usr/bin/env bash
#
# quartus adapter (commercial, optional).
# Enabled only when OPENRTL_VENDOR_TOOLS=1 and the binary is installed.
# Implements the same command surface OpenRTL expects.
set -euo pipefail
if ! command -v quartus >/dev/null 2>&1; then
  echo "error: quartus not installed" >&2
  exit 1
fi
exec "" "$@"
