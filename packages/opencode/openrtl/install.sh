#!/usr/bin/env bash
#
# OpenRTL installer (consolidated into the opencode workspace).
#
# Links the `openrtl` launcher into PATH and merges the OpenRTL skills/agents/
# commands into the global opencode config so every opencode project sees them.
#
# Usage:
#   ./install.sh [--no-global] [--prefix DIR]
#
# Options:
#   --no-global   do not touch the global opencode config (~/.config/opencode)
#   --prefix DIR  install location (default ~/.local/share/openrtl)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"

PREFIX="${OPENRTL_PREFIX:-${HOME}/.local/share/openrtl}"
BIN_DIR="${OPENRTL_BIN_DIR:-${HOME}/.local/bin}"
GLOBAL_CONFIG="${OPENRTL_GLOBAL_CONFIG:-${XDG_CONFIG_HOME:-${HOME}/.config}/opencode}"

NO_GLOBAL=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-global) NO_GLOBAL=1; shift ;;
    --prefix) PREFIX="$2"; shift 2 ;;
    *) shift ;;
  esac
done

echo "== OpenRTL installer =="
echo "  source:  $SOURCE_DIR"
echo "  install: $PREFIX"
echo "  bin:     $BIN_DIR"

mkdir -p "$PREFIX"
for dir in bundle scaffold docs toolchain; do
  rm -rf "$PREFIX/$dir"
  cp -R "$SOURCE_DIR/$dir" "$PREFIX/$dir"
done
mkdir -p "$PREFIX/bin"
cp "$SOURCE_DIR/bin/openrtl" "$PREFIX/bin/openrtl"
chmod +x "$PREFIX/bin/openrtl"

# Ship the OpenRTL-built binary (if present) so `openrtl` runs the branded
# TUI instead of the system opencode. The system install is never touched.
BUILT_BIN="$(cd "$SOURCE_DIR" && node -e '
  const fs = require("fs")
  const path = require("path")
  const dist = path.resolve("../dist")
  const candidates = fs.existsSync(dist)
    ? fs.readdirSync(dist).filter((d) => d.startsWith("openrtl-") && fs.existsSync(path.join(dist, d, "bin", "opencode")))
    : []
  if (candidates.length) {
    process.stdout.write(path.join(dist, candidates.sort().reverse()[0], "bin", "opencode"))
  }
' 2>/dev/null)"
if [[ -n "$BUILT_BIN" && -x "$BUILT_BIN" ]]; then
  cp "$BUILT_BIN" "$PREFIX/bin/opencode.new"
  chmod +x "$PREFIX/bin/opencode.new"
  mv -f "$PREFIX/bin/opencode.new" "$PREFIX/bin/opencode"
  echo "  bundled $PREFIX/bin/opencode ($(du -h "$PREFIX/bin/opencode" | cut -f1))"
else
  echo "  note: no OpenRTL-built binary found in dist/; openrtl will fall back to the system opencode"
fi

mkdir -p "$BIN_DIR"
if [[ -e "$BIN_DIR/openrtl" && ! -L "$BIN_DIR/openrtl" ]]; then
  echo "  warning: $BIN_DIR/openrtl exists and is not ours; leaving it alone."
else
  ln -sf "$PREFIX/bin/openrtl" "$BIN_DIR/openrtl"
  echo "  linked  $BIN_DIR/openrtl -> $PREFIX/bin/openrtl"
fi

if [[ "$NO_GLOBAL" -eq 0 ]]; then
  echo "  global opencode config: $GLOBAL_CONFIG"
  mkdir -p "$GLOBAL_CONFIG"
  for sub in skill agent command; do
    mkdir -p "$GLOBAL_CONFIG/$sub"
    for item in "$SOURCE_DIR/bundle/$sub/"*; do
      [[ -e "$item" ]] || continue
      cp -R "$item" "$GLOBAL_CONFIG/$sub/"
    done
  done
  if [[ ! -e "$GLOBAL_CONFIG/opencode.jsonc" && ! -e "$GLOBAL_CONFIG/opencode.json" ]]; then
    cp "$SOURCE_DIR/bundle/opencode.jsonc" "$GLOBAL_CONFIG/opencode.jsonc"
    echo "  wrote   $GLOBAL_CONFIG/opencode.jsonc (default provider config)"
  else
    echo "  note: global config exists; add provider/skills manually if OpenRTL models are missing."
  fi
else
  echo "  skipped global opencode config merge (--no-global)"
fi

echo ""
echo "OpenRTL installed."
echo ""
echo "Next steps:"
echo "  1. Ensure the opencode CLI is available:  command -v opencode"
echo "  2. export NVIDIA_API_KEY=<your-key>       (or add it to a project .env)"
echo "  3. openrtl new my-fpga-card               (scaffold a project)"
echo "  4. cd my-fpga-card && openrtl             (start the OpenRTL TUI)"
echo "  5. Type /openrtl in the TUI to begin the product-development workflow."