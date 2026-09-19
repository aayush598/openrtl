#!/usr/bin/env bash
# =============================================================================
# OpenRTL — ci.sh : CI entry point for the toolchain test suite
# -----------------------------------------------------------------------------
# Used by GitHub Actions (cicd/openrtl-ci.yml) and by any CI runner:
#   bash cicd/ci.sh                 # install if needed + doctor + full tests
#   bash cicd/ci.sh --skip-install  # assume provisioned image (runner cache)
#   bash cicd/ci.sh --strict        # gate on doctor even with --skip-install
#
# Fails (exit != 0) if any required tool is missing or any test suite FAILs.
# SKIPs (missing optional tools on a minimal image) are tolerated.
# =============================================================================
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

SKIP_INSTALL=0
STRICT=0
for a in "$@"; do
  [[ "$a" == "--skip-install" ]] && SKIP_INSTALL=1
  [[ "$a" == "--strict" ]] && STRICT=1
done

echo "== OpenRTL CI =="
echo "root: $ROOT"

# 1. provision ---------------------------------------------------------------
if [[ $SKIP_INSTALL -eq 1 ]]; then
  echo "--skip-install: assuming provisioned toolchain"
else
  echo "== provision =="
  bash "$ROOT/toolchain/provision.sh" || { echo "provision failed"; exit 1; }
fi

# 2. doctor -------------------------------------------------------------------
echo "== doctor =="
bash "$ROOT/toolchain/doctor.sh"
DOCTOR_RC=$?
echo "doctor exit: $DOCTOR_RC"

# 3. test suite ---------------------------------------------------------------
echo "== test suite =="
bash "$ROOT/tests/run_tests.sh"
TEST_RC=$?
echo "test suite exit: $TEST_RC"

# artifacts ----------------------------------------------------------------
ART_DIR="$ROOT/build/ci"
mkdir -p "$ART_DIR"
cp -r "$ROOT/docs" "$ART_DIR/" 2>/dev/null || true
echo "artifacts -> $ART_DIR"

if [[ $TEST_RC -ne 0 ]]; then
  echo "CI FAILED: test suite reported failures"
  exit 1
fi
# doctor is a gate when provisioning runs, or when explicitly requested
if [[ ($STRICT -eq 1 || $SKIP_INSTALL -eq 0) && $DOCTOR_RC -ne 0 ]]; then
  echo "CI FAILED: required toolchain components missing"
  exit 1
fi
echo "CI OK"
exit 0
