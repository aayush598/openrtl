# CI/CD

Continuous integration runs the toolchain test suite on every push, so a
broken tool integration is caught before it reaches anyone. Two pieces:

- `cicd/ci.sh` — the CI entry point (installs, verifies, tests)
- `cicd/openrtl-ci.yml` — GitHub Actions workflow template that calls it

## ci.sh

```bash
bash cicd/ci.sh                 # install if needed + doctor + full test suite
bash cicd/ci.sh --skip-install  # assume a provisioned image (CI runner cache)
bash cicd/ci.sh --strict        # gate on doctor even with --skip-install
```

Steps (skipped in `--skip-install` mode):

1. **Provision** — install conda env + pip tools (idempotent)
2. **Doctor** — verify the toolchain (`doctor.sh`), fail if a required tool
   is missing
3. **Test** — run `tests/run_tests.sh` (the full suite); fail on any `FAIL`

The suite design makes SKIPs acceptable: on a minimal image, tools that are
not part of that job simply skip. For a strong gate, the CI image is
provisioned (or `provision.sh` runs first), so every suite runs for real.

## GitHub Actions template

`cicd/openrtl-ci.yml` is a drop-in workflow:

- **Runner**: ubuntu-latest
- **Matrix**: a single comprehensive job (yosys, nextpnr, icestorm,
  iverilog, verilator, symbiyosys, cocotb, pytest), extendable per-arch
- **Steps**: checkout → setup conda/pip (cache) → `cicd/ci.sh --skip-install`
  → upload test logs + reports as artifacts on failure

Wiring it into a repo:

```yaml
# .github/workflows/openrtl-ci.yml
name: openrtl-ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run OpenRTL CI
        run: bash packages/openrtl/cicd/ci.sh
```

See `cicd/openrtl-ci.yml` for the full template (conda setup, caching,
artifact upload).
