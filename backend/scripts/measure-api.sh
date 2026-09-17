#!/usr/bin/env bash
# Measure Express API latency (requires populated backend/.env for data routes).
set -euo pipefail
BASE="${VITE_API_URL:-http://localhost:4318}"
COOKIE_JAR="${TMPDIR:-/tmp}/melkoraa-spa-cookies.txt"

measure() {
  local label="$1"
  local method="$2"
  local path="$3"
  local data="${4:-}"
  local extra="${5:-}"
  local start end ms code
  start=$(date +%s%3N)
  if [ "$method" = "GET" ]; then
    code=$(curl -s -o /tmp/melkoraa-resp.json -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" $extra "$BASE$path")
  else
    code=$(curl -s -o /tmp/melkoraa-resp.json -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" $extra -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE$path")
  fi
  end=$(date +%s%3N)
  ms=$((end - start))
  printf "%-28s %3s %4sms\n" "$label" "$code" "$ms"
}

echo "=== MELKORAA SPA API timings ($BASE) ==="
rm -f "$COOKIE_JAR"
measure "health" GET "/api/v1/health"
measure "products (drop-001)" GET "/api/v1/products?drop=drop-001&pageSize=20"
measure "categories" GET "/api/v1/categories"
measure "drops/drop-001" GET "/api/v1/drops/drop-001"
measure "auth/me (anon)" GET "/api/v1/auth/me"
measure "cart (anon)" GET "/api/v1/cart"
measure "register" POST "/api/v1/auth/register" '{"fullName":"SPA Test","email":"spa-test-'$(date +%s)'@example.com","password":"Test1234","confirmPassword":"Test1234"}'
measure "auth/me (after reg)" GET "/api/v1/auth/me"
FIRST_VARIANT=$(node -e "const j=require('/tmp/melkoraa-resp.json');const p=j.data?.[0]||j.data;const v=p?.variants?.[0]?.id;if(v)process.stdout.write(v)" 2>/dev/null || true)
if [ -n "${FIRST_VARIANT:-}" ]; then
  measure "cart add item" POST "/api/v1/cart/items" "{\"variantId\":\"$FIRST_VARIANT\",\"quantity\":1}"
  measure "cart GET" GET "/api/v1/cart"
  measure "checkout prep" GET "/api/v1/addresses"
else
  echo "(skip cart/checkout — no variant from products)"
fi
