#!/usr/bin/env bash
#
# Live smoke test against the DEPLOYED Novartis ESG backend. Automates the
# manual post-deploy verification: health, auth enforcement, a DynamoDB
# round-trip, and each AI route — including telling REAL AI from the graceful
# fallback. Safe to run against production: it only ever touches a throwaway
# report id ("__smoke") and deletes what it writes; it never reads or mutates
# real report data (rnfm, hrs, ...).
#
# Usage:
#   ID_TOKEN=eyJ... ./scripts/smoke-prod.sh
#   ./scripts/smoke-prod.sh <id-token>
#
# Getting a token (it's short-lived, ~1h): log in to the live site, then in the
# browser DevTools Console run:
#   (()=>{const k=Object.keys(localStorage).find(k=>/CognitoIdentityServiceProvider\..*\.idToken$/.test(k));if(k){copy(localStorage.getItem(k));return 'idToken copied';}return 'not logged in?';})()
#
# Without a token, only the unauthenticated checks run (health + 401s).
#
# Env:
#   BASE       — deployed site base URL (required)
#   ID_TOKEN   — Cognito ID token for the authed checks (or pass as $1)
set -uo pipefail

BASE="${BASE:?set BASE to the deployed app URL, e.g. https://esg-studio.example.com}"
TOKEN="${ID_TOKEN:-${1:-}}"
SMOKE_REPORT="__smoke"   # throwaway report scope — never a real report id

pass=0; fail=0
ok()   { echo "  ✓ $1"; pass=$((pass+1)); }
bad()  { echo "  ✗ $1"; fail=$((fail+1)); }

hdr() { echo ""; echo "── $1"; }

# ---------------------------------------------------------------------------
# Unauthenticated checks (no token needed)
# ---------------------------------------------------------------------------
hdr "Unauthenticated"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/health")
[ "$code" = "200" ] && ok "/health → 200" || bad "/health → $code (expected 200)"

for path in "reports/$SMOKE_REPORT/sections" "ai/chat" "ai/peer" "ai/draft" "ai/compliance"; do
  method=GET; body=''
  case "$path" in ai/*) method=POST; body='{}';; esac
  code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" \
    ${body:+-H 'Content-Type: application/json' -d "$body"} "$BASE/api/$path")
  [ "$code" = "401" ] && ok "unauth /api/$path → 401" || bad "unauth /api/$path → $code (expected 401)"
done

# ---------------------------------------------------------------------------
# Authenticated checks (require a token)
# ---------------------------------------------------------------------------
if [ -z "$TOKEN" ]; then
  echo ""
  echo "No ID_TOKEN provided — skipping authenticated + AI checks."
  echo "Pass a token: ID_TOKEN=eyJ... $0   (see header for how to grab one)"
else
  # Warn if the token is already expired (best-effort JWT exp decode).
  exp=$(printf '%s' "$TOKEN" | cut -d. -f2 | tr '_-' '/+' | { read p; python3 - "$p" <<'PY' 2>/dev/null
import sys,base64,json,time
p=sys.argv[1]; p+='='*(-len(p)%4)
try:
    c=json.loads(base64.b64decode(p)); print(c.get('exp',0)-int(time.time()))
except Exception: print('?')
PY
  })
  case "$exp" in ''|'?') : ;; -*) echo "  ⚠ token appears EXPIRED (${exp}s) — authed checks will 401";; *) echo "  (token ~${exp}s remaining)";; esac

  AUTH=(-H "Authorization: Bearer $TOKEN")
  JSON=(-H 'Content-Type: application/json')

  hdr "DynamoDB round-trip (throwaway report '$SMOKE_REPORT')"
  # PUT a doc, GET it back, confirm it matches, then DELETE (cleanup).
  put=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${AUTH[@]}" "${JSON[@]}" \
    -d '[{"id":"smoke-1","content":"live smoke test"}]' "$BASE/api/reports/$SMOKE_REPORT/sections")
  [ "$put" = "200" ] && ok "PUT sections → 200" || bad "PUT sections → $put"
  got=$(curl -s "${AUTH[@]}" "$BASE/api/reports/$SMOKE_REPORT/sections")
  echo "$got" | grep -q 'smoke-1' && ok "GET sections returns what we PUT" || bad "GET sections mismatch: $got"
  del=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "${AUTH[@]}" "$BASE/api/reports/$SMOKE_REPORT/sections")
  { [ "$del" = "204" ] || [ "$del" = "200" ]; } && ok "DELETE sections (cleanup) → $del" || bad "DELETE sections → $del"

  # --- AI routes: 200 + real-vs-fallback detection -------------------------
  # Each fallback has a signature phrase; if the response lacks it, real AI answered.
  ai_check() {
    local label="$1" path="$2" payload="$3" fallback_sig="$4"
    local resp code
    resp=$(curl -s -w '\n%{http_code}' -X POST "${AUTH[@]}" "${JSON[@]}" -d "$payload" "$BASE/api/$path")
    code=$(printf '%s' "$resp" | tail -n1)
    body=$(printf '%s' "$resp" | sed '$d')
    if [ "$code" != "200" ]; then bad "$label → HTTP $code"; return; fi
    if printf '%s' "$body" | grep -qiF "$fallback_sig"; then
      bad "$label → 200 but FELL BACK (sim/graceful): matched '$fallback_sig'"
    else
      ok "$label → 200, REAL AI (no fallback signature)"
    fi
  }

  hdr "AI routes (real Bedrock vs graceful fallback)"
  ai_check "ai/chat"       "ai/chat"       '{"prompt":"Draft one sentence on our transition plan. No invented figures.","sectionTitle":"Climate strategy and roadmap"}' 'temporarily unavailable'
  ai_check "ai/peer"       "ai/peer"       '{"question":"Rank peers by net-zero target year.","corpus":"Roche net zero 2045. GSK net zero 2045 operations 2030. Pfizer 2040. Sanofi 2045. AstraZeneca 2045."}' 'temporarily unavailable'
  ai_check "ai/draft"      "ai/draft"      '{"sectionTitle":"Climate strategy and roadmap","drRef":"ESRS-E1-4","priorYearText":"In 2025 we advanced our SBTi transition plan."}' '"text":null'
  ai_check "ai/compliance" "ai/compliance" '{"drId":"ESRS-E1-9","title":"Financial effects","status":"missing"}' '"rationale":null'
  # analyze: fallback signature is {"flags":null}. A real run returns {"flags":[...]}
  # (possibly []), so absence of the null signature = the model ran.
  ai_check "ai/analyze"    "ai/analyze"    '{"content":"We are committed to to net zero. Emissions of CO2 rose 5 per cent."}' '"flags":null'
fi

# ---------------------------------------------------------------------------
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  SMOKE SUMMARY:  $pass passed, $fail failed"
echo "════════════════════════════════════════════════════════════"
[ "$fail" -eq 0 ] && echo "✓ ALL GREEN" || echo "✗ FAILURES ABOVE"
exit "$fail"
