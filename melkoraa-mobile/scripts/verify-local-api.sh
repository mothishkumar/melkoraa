#!/usr/bin/env bash
set -euo pipefail

# Verify the melkoraa_mobile API Bearer boundary from your machine.
# Does NOT use a hardcoded LAN IP — pass the same URL your phone will use.
#
# Usage:
#   API_URL=http://localhost:4317/api/v1 ./scripts/verify-local-api.sh
#   API_URL=http://<LAN-IP>:4317/api/v1 ./scripts/verify-local-api.sh

API_URL="${API_URL:-${EXPO_PUBLIC_API_URL:-http://localhost:4317/api/v1}}"
API_URL="${API_URL%/}"

echo "Verifying API at: ${API_URL}"
echo

failures=0

check_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  OK   ${name} (HTTP ${actual})"
  else
    echo "  FAIL ${name} (expected HTTP ${expected}, got ${actual})"
    failures=$((failures + 1))
  fi
}

status_code() {
  curl -s -o /tmp/melkoraa-api-body.txt -w "%{http_code}" "$1"
}

echo "Public / protected boundary"
check_status "GET /health" "200" "$(status_code "${API_URL}/health")"
check_status "GET /products" "200" "$(status_code "${API_URL}/products?page=1&pageSize=1")"
check_status "GET /auth/me (no auth)" "401" "$(status_code "${API_URL}/auth/me")"
check_status "GET /auth/me (invalid Bearer)" "401" "$(curl -s -o /tmp/melkoraa-api-body.txt -w "%{http_code}" -H "Authorization: Bearer invalid-token" "${API_URL}/auth/me")"
check_status "GET /cart (no auth)" "401" "$(status_code "${API_URL}/cart")"
check_status "GET /wishlist (no auth)" "401" "$(status_code "${API_URL}/wishlist")"
check_status "GET /orders (no auth)" "401" "$(status_code "${API_URL}/orders")"

echo
if [[ "$failures" -gt 0 ]]; then
  echo "${failures} check(s) failed."
  echo "If /products returns 500, ensure the repo root .env has DATABASE_URL and Supabase keys."
  exit 1
fi

echo "All boundary checks passed."
echo "Valid Bearer + user-scoped success paths require a real Supabase sign-in (test on device)."
