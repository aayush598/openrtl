# Toolchain — setup & verification

Step-by-step guide to install the OpenRTL toolchain, verify it, and run the
automated checks. The whole stack is open source (Apache-2.0 / MIT / BSD),
installable from conda-forge, pip, or straight from source via a single
installer, and machine-readable in a single manifest.

## 1. Prerequisites

| Requirement | Needed for | Notes |
|-------------|-----------|-------|
| Linux / macOS / Windows (WSL2) | everything | the installer auto-detects the platform |
| `conda` or `mamba` | the EDA binaries | recommended; a bare `python3 >= 3.9` + pip gives a minimal subset |
| `bun` | project scaffold | only needed for `scaffold.ts` |

Check what's already present:

```bash
conda --version            # or: micromamba --version
python3 --version
bun --version              # optional (scaffold only)
```

## 2. Install the toolchain

```bash
bash packages/openrtl/toolchain/provision.sh
```

The one-shot installer:

- detects conda / micromamba and creates the `openrtl` environment from
  `toolchain/conda-env.yml` (or installs into an existing one),
- pip-installs the Python-side tools (cocotb, pytest, pyverilog),
- is idempotent — safe to re-run after upgrading.

The FPGA place-and-route stack (icestorm, nextpnr-ice40) and SymbiYosys are
**not** available on conda-forge, so a full install is conda (+ pip) followed
by the source route (or just the source route when your OS already packages
yosys/verilator, as on most distros):

```bash
bash provision.sh                  # conda env + pip
bash provision.sh --source         # builds icestorm, nextpnr, iverilog, SymbiYosys
```

Useful variants:

```bash
bash provision.sh --check    # report what's missing, install nothing
bash provision.sh --conda    # force the conda route
bash provision.sh --source   # build the non-conda tools from source (~/.local/openrtl)
bash provision.sh --pip      # only the Python-side tools
```

### What gets installed

| Tool            | Package      | Source  | Used by                          |
|-----------------|--------------|---------|----------------------------------|
| Yosys           | `yosys`      | conda   | synthesis, formal (SAT/BMC), verify |
| nextpnr         | `nextpnr`    | source  | place & route + STA              |
| icestorm        | `icestorm`   | source  | bitstream packing (`icepack`)    |
| icetime         | `icestorm`   | source  | static timing analysis           |
| Icarus Verilog  | `iverilog`   | conda/source | simulation (cocotb backend)  |
| Verilator       | `verilator`  | conda   | lint, 2-state sim, coverage      |
| SymbiYosys      | `symbiyosys` | source  | formal property checking (`sby`) |
| cocotb          | `cocotb`     | pip     | coroutine-based testbench        |
| pytest          | `pytest`     | pip     | test runner / regression reports |
| pyverilog       | `pyverilog`  | pip     | RTL analysis (optional)          |
| Python          | `python>=3.9`| conda   | report engine, cocotb            |

"source" means `provision.sh --source` builds the tool from its upstream repo
into `~/.local/openrtl` (override with `OPENRTL_PREFIX`). Each build is
skipped when the tool is already on `PATH`, so the route is idempotent.

The authoritative inventory — versions, packages, health checks, and the
flow/phase mapping — is [`toolchain/manifest.yaml`](../toolchain/manifest.yaml).
`provision.sh` and `doctor.sh` read it, so there is a single source of truth.

## 3. Verify the installation

```bash
bash packages/openrtl/toolchain/doctor.sh
```

Prints every tool, its version and a `PASS` / `FAIL` / `SKIP` verdict, then a
summary. The exit code is non-zero if any **required** tool is missing, which
makes `doctor` a usable CI gate:

```bash
bash packages/openrtl/toolchain/doctor.sh && echo "toolchain healthy"
```

Optional tools (cocotb, pytest, zip, SymbiYosys) are reported as `SKIP`
rather than failing the check.

## 4. Run the automated test suite

Every tool is covered by automated tests, so **no manual testing is
required**:

```bash
bash packages/openrtl/tests/run_tests.sh                    # all suites
bash packages/openrtl/tests/run_tests.sh --only yosys       # one suite
bash packages/openrtl/toolchain/flow.sh test --only report  # via flow driver
```

Suites: `yosys` · `verilator` · `iverilog` · `nextpnr` · `icetime` · `cocotb`
· `sby` · `report` · `flow` · `scaffold`. Installed tools are tested for real;
missing ones report `SKIP`; any failure is a non-zero exit. See
[Testing](testing.md).

## 5. Start a project

```bash
# scaffold a 36-phase project
bun packages/openrtl/scaffold/scaffold.ts \
    --name myproject --desc "your product idea" --top top --arch ice40

# run the whole pipeline from the project root
cd myproject
bash <path-to>/packages/openrtl/toolchain/flow.sh all
```

See [flow.sh](flow.md) for every command and the artifact layout.

## Reproducible environment (CI)

The conda environment used by CI lives in `toolchain/conda-env.yml`:

```bash
conda env create -f packages/openrtl/toolchain/conda-env.yml
conda activate openrtl
bash packages/openrtl/toolchain/provision.sh --source   # P&R + formal tools
```

The GitHub Actions template (`cicd/openrtl-ci.yml`) provisions this env and
gates on the test suite — see [CI/CD](ci-cd.md).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `doctor` shows `FAIL` for a tool | run `bash provision.sh` (or `provision.sh --source`) to install it |
| `conda` not found | install conda/mamba, or run `provision.sh --source` to build the tools from source |
| simulation/formal suites `SKIP` | those tools (iverilog, nextpnr, icetime, sby) are not installed — run `provision.sh --source` |
| tools missing from `$PATH` after source install | open a new shell (the route adds `~/.local/openrtl/bin` to your rc file) |
| after upgrading a tool | re-run `doctor.sh` and the test suite |
