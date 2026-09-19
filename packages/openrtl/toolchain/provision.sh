#!/usr/bin/env bash
# =============================================================================
# OpenRTL — provision.sh : one-shot open-source EDA toolchain installer
# -----------------------------------------------------------------------------
# Installs the full open-source FPGA flow (Yosys, nextpnr, icestorm, Icarus
# Verilog, Verilator, SymbiYosys, cocotb, pytest) via conda-forge + pip.
# The same command works on Linux/macOS/Windows(WSL2).
#
# Usage:
#   bash provision.sh            # detect manager, install everything
#   bash provision.sh --conda    # force conda route
#   bash provision.sh --source   # build icestorm/nextpnr/iverilog/SymbiYosys from source
#   bash provision.sh --pip      # only Python-side tools (cocotb etc.)
#   bash provision.sh --check    # only report what's missing
#
# Install sources:
#   conda-forge provides yosys, iverilog and verilator. The FPGA place-and-route
#   stack (icestorm, nextpnr-ice40) and SymbiYosys are not available on
#   conda-forge, so the recommended full install is conda (+ pip) followed by
#   `--source` for the missing tools, or --source alone when yosys/verilator are
#   already installed via the system package manager.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="auto"
for a in "$@"; do
  case "$a" in
    --conda) MODE="conda" ;;
    --source) MODE="source" ;;
    --pip) MODE="pip" ;;
    --check) MODE="check" ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

JOBS="${OPENRTL_JOBS:-$(nproc 2>/dev/null || echo 4)}"
SRC_DIR="${OPENRTL_SRC_DIR:-$(mktemp -d /tmp/openrtl-src-XXXXXX)}"
trap 'rm -rf "$SRC_DIR"' EXIT

say() { printf '\033[1;32m[provision] %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[provision] %s\033[0m\n' "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }
# pip --user, adding --break-system-packages on PEP 668 (externally-managed)
# distros so the --pip / --source routes work without a venv.
pip_user() {
  local args=(--user)
  if python3 -c 'import sysconfig, os; p=os.path.join(sysconfig.get_path("stdlib"), "EXTERNALLY-MANAGED"); print(os.path.exists(p))' 2>/dev/null | grep -q True; then
    args+=(--break-system-packages)
  fi
  # COCOTB_IGNORE_PYTHON_REQUIRES lets cocotb build its sdist on Python
  # versions its setup.py guards against (e.g. 3.14), falling back to a wheel
  # when one is available.
  COCOTB_IGNORE_PYTHON_REQUIRES=1 python3 -m pip install "${args[@]}" "$@"
}

# ------------------------------------------------------------------ detect --
have_conda() { command -v conda >/dev/null 2>&1; }
have_apt()   { command -v apt-get >/dev/null 2>&1; }
have_brew()  { command -v brew >/dev/null 2>&1; }
have_pip()   { command -v pip3 >/dev/null 2>&1; }

needed=(yosys nextpnr-ice40 iverilog verilator icepack icetime sby)
missing=()
for t in "${needed[@]}"; do
  command -v "$t" >/dev/null 2>&1 || missing+=("$t")
done

if [[ "$MODE" == "check" ]]; then
  if [[ ${#missing[@]} -eq 0 ]]; then
    say "toolchain complete: ${needed[*]}"
  else
    warn "missing: ${missing[*]}"
  fi
  exit 0
fi

say "open-source EDA toolchain installer"
say "missing tools: ${missing[*]:-none}"

# ------------------------------------------------------------ source route --
# Build the tools conda-forge lacks (icestorm, nextpnr-ice40) plus iverilog
# and SymbiYosys from source into $OPENRTL_PREFIX (default ~/.local/openrtl).
# Each step is skipped when the tool is already on PATH, so the route is
# idempotent and complements a conda/system install of yosys + verilator.
build_iverilog() { # build_iverilog <prefix>
  if have iverilog; then say "iverilog already present, skipping"; return; fi
  local prefix="$1"
  say "building Icarus Verilog from source..."
  git clone --depth 1 -b v13_0 https://github.com/steveicarus/iverilog.git "$SRC_DIR/iverilog"
  ( cd "$SRC_DIR/iverilog" \
    && sh autoconf.sh \
    && ./configure --prefix="$prefix" \
    && make -j"$JOBS" \
    && make install )
  say "iverilog -> $prefix/bin"
}

build_icestorm() { # build_icestorm <prefix>
  if have icepack; then say "icestorm already present, skipping"; return; fi
  local prefix="$1"
  say "building icestorm (icepack/icetime) from source..."
  git clone --depth 1 https://github.com/cliffordwolf/icestorm.git "$SRC_DIR/icestorm"
  ( cd "$SRC_DIR/icestorm" && make -j"$JOBS" PREFIX="$prefix" && make install PREFIX="$prefix" )
  say "icestorm -> $prefix/bin"
}

build_nextpnr() { # build_nextpnr <prefix>
  if have nextpnr-ice40; then say "nextpnr already present, skipping"; return; fi
  local prefix="$1"
  say "building nextpnr (ice40) from source..."
  git clone --depth 1 https://github.com/YosysHQ/nextpnr.git "$SRC_DIR/nextpnr"
  ( cd "$SRC_DIR/nextpnr" \
    && cmake -DCMAKE_INSTALL_PREFIX="$prefix" \
             -DCMAKE_BUILD_TYPE=Release \
             -DARCH=ice40 \
             -DICEBOX_ROOT="$prefix/share/icebox" \
             -DBUILD_PYTHON=OFF -DBUILD_GUI=OFF . \
    && make -j"$JOBS" \
    && make install )
  say "nextpnr-ice40 -> $prefix/bin"
}

build_symbiyosys() { # build_symbiyosys <prefix>
  if have sby; then say "SymbiYosys already present, skipping"; return; fi
  local prefix="$1"
  say "building SymbiYosys (sby) from source..."
  git clone --depth 1 https://github.com/YosysHQ/SymbiYosys.git "$SRC_DIR/SymbiYosys"
  ( cd "$SRC_DIR/SymbiYosys" && make -j"$JOBS" && make install PREFIX="$prefix" )
  say "sby -> $prefix/bin"
}

source_route() {
  local PREFIX="${OPENRTL_PREFIX:-$HOME/.local/openrtl}"
  local PREFIX_BIN="$PREFIX/bin"
  export PATH="$PREFIX_BIN:$PATH"
  mkdir -p "$PREFIX_BIN"

  local bd=(git make cmake gcc g++ bison flex)
  local missing_bd=()
  for b in "${bd[@]}"; do have "$b" || missing_bd+=("$b"); done
  if [[ ${#missing_bd[@]} -gt 0 ]]; then
    warn "missing build dependencies: ${missing_bd[*]}"
    warn "install them with your package manager (e.g. build-essential, git, cmake, bison, flex) and re-run."
    exit 1
  fi

  say "source install prefix: $PREFIX (set OPENRTL_PREFIX to override)"
  build_iverilog "$PREFIX"
  build_icestorm "$PREFIX"
  build_nextpnr "$PREFIX"
  build_symbiyosys "$PREFIX"

  say "installing Python-side tools (cocotb, pytest, pyverilog, PyYAML, z3)..."
  pip_user cocotb pytest pyverilog PyYAML z3-solver

  local line="export PATH=\"$PREFIX_BIN:\$PATH\""
  for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
    if [[ -f "$rc" ]] && ! grep -qF "$PREFIX_BIN" "$rc"; then
      printf '\n# OpenRTL toolchain (source install)\n%s\n' "$line" >> "$rc"
      say "added $PREFIX_BIN to PATH in $rc"
    fi
  done
  say "done. Open a new shell (or source your rc file) and run:  flow.sh doctor"
}

# --------------------------------------------------------------- conda route --
if [[ "$MODE" == "conda" || ("$MODE" == "auto" && (${#missing[@]} -gt 0 || ! have_conda)) ]]; then
  if ! have_conda; then
    warn "conda not found."
    if have_apt; then
      say "installing miniforge via apt (requires sudo)..."
      sudo apt-get update
      sudo apt-get install -y curl
    elif have_brew; then
      say "installing miniforge via brew..."
      brew install --cask miniforge
    else
      warn "install Miniforge from https://github.com/conda-forge/miniforge then re-run."
      warn "falling back to apt packages below."
    fi
  fi
  if have_conda; then
    say "creating conda env 'openrtl'..."
    conda env create -f "$SCRIPT_DIR/conda-env.yml" 2>/dev/null || conda env update -f "$SCRIPT_DIR/conda-env.yml"
    say "env ready. Activate with:  conda activate openrtl"
    say "then run:  flow.sh doctor"
    exit 0
  fi
fi

if [[ "$MODE" == "source" ]]; then
  source_route
  exit 0
fi

# ------------------------------------------------------------- pip route ----
if [[ "$MODE" == "pip" ]]; then
  say "installing Python-side tools (cocotb, pytest, pyverilog)..."
  pip_user cocotb pytest pyverilog PyYAML
  exit 0
fi

# --------------------------------------------------------------- apt route ---
if [[ "$MODE" == "auto" && ${#missing[@]} -gt 0 ]]; then
  if have_apt; then
    say "using apt packages (conda recommended for reproducibility)..."
    sudo apt-get update
    sudo apt-get install -y \
      yosys nextpnr-ice40 nextpnr-ecp5 icestorm iverilog verilator \
      python3-pip python3-venv 2>/dev/null || \
      sudo apt-get install -y yosys iverilog verilator icestorm 2>/dev/null || \
      { warn "apt install failed — please install manually or use conda route."; exit 1; }
    say "apt install complete. Installing pip tools..."
    pip_user cocotb pytest pyverilog PyYAML
    say "done. Run:  flow.sh doctor"
  elif have_brew; then
    say "using brew..."
    brew install yosys nextpnr icestorm iverilog verilator python
    pip_user cocotb pytest pyverilog PyYAML
    say "done. Run:  flow.sh doctor"
  else
    warn "no supported package manager found. See README for manual install."
    exit 1
  fi
fi
