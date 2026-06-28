#!/usr/bin/env bash
# Smoke-test the Nabdh backend AI coach route end-to-end.
#
#   1. start the backend:   cd backend && npm run dev
#   2. run this:            ./scripts/smoke-ai.sh
#
# Override the target with BASE_URL, e.g.
#   BASE_URL=http://192.168.1.20:8080 ./scripts/smoke-ai.sh
#
# Requires a configured provider in backend/.env:
#   AI_PROVIDER=groq   + GROQ_API_KEY=...                (quick test, US)
#   AI_PROVIDER=vertex + GOOGLE_CLOUD_PROJECT=... + ADC  (in-region default)

set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "→ Target: $BASE_URL"
echo
echo "1) GET /health"
curl -fsS "$BASE_URL/health" && echo || { echo "  ✗ backend not reachable — is it running?"; exit 1; }

echo
echo "2) POST /ai/coach  (Arabic message + sample minimized metrics)"
body='{
  "messages": [{ "role": "user", "content": "كيف نومي اليوم وش تنصحني؟" }],
  "summary": { "steps": 8432, "restingHeartRate": 58, "hrvSdnn": 48, "spo2": 97, "sleepMinutes": 437, "activeEnergyKcal": 612, "distanceKm": 6.1 },
  "water": 3,
  "locale": "ar",
  "isRamadan": false
}'

# -w prints the HTTP status on its own line after the body.
resp="$(curl -sS -w $'\n%{http_code}' -X POST "$BASE_URL/ai/coach" \
  -H 'Content-Type: application/json' -d "$body")"
code="$(printf '%s' "$resp" | tail -n1)"
payload="$(printf '%s' "$resp" | sed '$d')"

echo "   HTTP $code"
if command -v jq >/dev/null 2>&1; then
  printf '%s' "$payload" | jq .
else
  printf '   %s\n' "$payload"
fi

echo
case "$code" in
  200) echo "✓ Coach route OK." ;;
  503) echo "⚠ Provider not configured. Set AI_PROVIDER + the matching key/creds in backend/.env." ;;
  502) echo "⚠ Provider call failed (bad key, region, or quota). See the 'detail' above." ;;
  *)   echo "✗ Unexpected status $code." ;;
esac
