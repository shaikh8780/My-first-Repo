#!/usr/bin/env bash
#
# One-command full test suite for the Novartis ESG studio. Runs every automated
# check and reports a single aggregated pass/fail, so "is everything green?" is
# one command. Runs OFFLINE — no AWS creds, no live backend needed (the frontend
# suite builds in LocalAdapter mode; the backend suite mocks DynamoDB + Bedrock).
#
#   ./scripts/test-all.sh
#
# Layers:
#   1. Backend  — pytest (store + AI routes; moto-mocked DynamoDB, mocked Bedrock)
#   2. Frontend — tsc typecheck
#   3. Frontend — Vitest unit tests (api/ adapters + aiClient + port contract)
#   4. Frontend — Playwright E2E (LocalAdapter build)
#
# Env:
#   PYTHON     — python interpreter with backend deps (default: python3;
#                a venv with requirements-dev.txt installed is expected)
#   SKIP_E2E=1 — skip the slow Playwright layer (quick inner-loop run)
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PYTHON="${PYTHON:-python3}"

fail=0
declare -a RESULTS

run() {
  local name="$1"; shift
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "▶ $name"
  echo "════════════════════════════════════════════════════════════"
  if "$@"; then
    RESULTS+=("PASS  $name")
  else
    RESULTS+=("FAIL  $name")
    fail=1
  fi
}

run "Backend pytest"        "$PYTHON" -m pytest -q
run "Frontend tsc"          bash -c "cd frontend && npx tsc --noEmit"
run "Frontend Vitest"       bash -c "cd frontend && npx vitest run"
if [ "${SKIP_E2E:-0}" != "1" ]; then
  run "Frontend Playwright" bash -c "cd frontend && npx playwright test"
else
  RESULTS+=("SKIP  Frontend Playwright (SKIP_E2E=1)")
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  SUMMARY"
echo "════════════════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do echo "  $r"; done
echo ""
if [ "$fail" -eq 0 ]; then
  echo "✓ ALL GREEN"
else
  echo "✗ FAILURES ABOVE"
fi
exit "$fail"
