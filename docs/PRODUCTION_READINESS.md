# Production readiness

Phase 11 hardening for MELKORAA. This is not a feature document. Classification uses CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL.

Architecture remains: Browser → Vercel/Next.js → Supabase (Auth, PostgreSQL, Storage); Razorpay Checkout in the browser; Razorpay API from the server.

## 1. Security checklist

- [x] Service-role, database URLs, and Razorpay secrets are server-only (`src/lib/env/server.ts`). Public env is anon URL/key + site URL.
- [x] `.env` / `.env.local` gitignored. `.env.example` has names and placeholders only.
- [x] Client modules do not read `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_DATABASE_URL`, `RAZORPAY_KEY_SECRET`, or `RAZORPAY_WEBHOOK_SECRET`.
- [x] Only Razorpay **key id** is returned to checkout (`getRazorpayPublicKeyId`).
- [x] Open redirects rejected (`getSafeRedirectPath`).
- [x] Zod `.strict()` on mutation bodies.
- [x] Security headers (CSP, nosniff, frame deny, referrer, permissions, HSTS in production).

## 2. Authentication

Supabase Auth + cookie session (`@supabase/ssr`). `getUser()` in proxy and server helpers. Protected pages redirect to `/login`. Unauthenticated APIs return **401**. Invalid credentials map to a generic message. Forgot-password copy does not confirm account existence.

App-level rate limits (in-memory, per isolate) sit in front of login, register, and forgot-password. Supabase also rate-limits. In-memory limits are **not** a cluster-wide control plane.

## 3. Authorization

| | Customer APIs (own resources) | Admin GET | Catalog/inventory/drop mutations | Audit log GET |
| --- | --- | --- | --- | --- |
| customer | allowed | 403 | 403 | 403 |
| staff | allowed | allowed | 403 | 403 |
| manager | allowed | allowed | allowed | allowed |
| admin | allowed | allowed | allowed | allowed |

Server guards: `requireApiAuth` / `requireApiStaff` / `requireApiManager` / `requireApiAdmin`. UI hiding is not authorization.

## 4. RLS

Phase 2 policies remain enabled and forced. Drizzle uses `DATABASE_URL` (typically bypasses RLS); APIs still filter by session user id. Service-role is used for customer email lookup on the admin customers page only, server-side.

## 5. Payment security

Webhook: raw body + HMAC before parse. Invalid signature rejected. `payment.captured` / `payment.failed` supported. Unknown valid events acknowledged without mutating stock. Duplicate provider events do not double-confirm inventory or downgrade paid orders.

Verify: authenticated, order owned by session user, signature, amount, currency, provider order linkage. Client cannot send `amount` / `paymentStatus`.

## 6. Inventory consistency

`available = on_hand - reserved`. Adjust cannot make on-hand negative or below reserved. Concurrent `reserve(1)` against `on_hand=1` is covered by existing integration tests (exactly one succeeds). Ledger insert shares the mutation transaction (rollback on ledger failure).

## 7. Idempotency

Checkout unique `(user_id, idempotency_key)`. Payment unique provider event ids. Inventory ledger unique reference where used.

**Known gap (MEDIUM):** if Razorpay `orders.create` succeeds but attaching `provider_order_id` to the internal payment fails, an orphan provider order can exist. Retry of the same checkout idempotency key returns the existing unpaid internal order and attempts attach again. There is no distributed saga. Do not create a second Razorpay order from the browser.

## 8. Database pooling

**Finding:** `runtimePostgresOptions.max` was **1** for every runtime client. On a long-lived Node process (dev server, a warm Vercel isolate) concurrent catalog/admin requests queued on one postgres.js connection and appeared “stuck” when that connection was busy.

**Change:** `resolvePostgresPoolMax()` — tests default **1**; production/dev default **4**; hard cap **8**; override `POSTGRES_POOL_MAX`. Still `prepare: false` for the transaction pooler. `DIRECT_DATABASE_URL` remains migrations/Drizzle Kit only.

This is **not** a global Supabase quota increase. Each serverless isolate may open up to `max` pooler clients. Do not set a large value.

Transactions: checkout still uses `getDb().transaction`; nested inventory calls receive the same tx. Raising `max` does not change commit semantics.

## 9. Performance findings

- Public/admin product lists are paginated (max pageSize 100).
- Admin/customer order lists now load line items in **one** `inArray` query instead of N+1 `listOrderItems`.
- Admin dashboard recent orders use the same batch.
- Admin customers still resolve emails with per-user `auth.admin.getUserById` on the current page (MEDIUM, bounded by pageSize).
- Catalog slowness when the pooler was busy is primarily the old `max: 1` queueing, not missing indexes on the seeded catalog size.

Public catalog still exposes `available` boolean only, never on-hand/reserved/sold.

## 10. Rate limiting

App-level sliding windows (in-memory):

| Surface | Limit (per isolate) |
| --- | --- |
| login | 8 / minute / IP+email |
| register | 5 / 15 minutes / IP+email |
| forgot password | 5 / 15 minutes / IP+email |
| checkout | 8 / minute / IP+user |
| payment verify | 20 / minute / IP+user |
| admin product create | 30 / minute |
| inventory adjust | 30 / minute |

Webhook is **not** app-rate-limited so Razorpay retries are not dropped. Treat in-memory limits as a shield, not a platform.

## 11. Headers

Applied to `/:path*`: CSP (Razorpay checkout/frame/connect exceptions; `'unsafe-inline'` / `'unsafe-eval'` for Next.js + Checkout.js), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo off), HSTS in production.

## 12. Storage security

`product-images` upload: manager/admin, MIME allowlist, 5MB, UUID filenames, path traversal and `.php` extensions mapped to `.bin`. Upload uses the user session client (RLS), not service role.

## 13. Logging

Structured JSON. Keys matching secrets/tokens/signatures redacted. Postgres URIs and JWTs scrubbed in string values. 500 responses never include SQL or stack traces.

## 14. Audit logging

`audit_logs` remains append-oriented. Phase 11 writers (best-effort, never fail the business mutation): product create/update/archive, drop create/update/archive, collection create/update/archive, inventory adjust. Metadata sanitized. Checkout reserve/sale is **not** written (high volume; inventory ledger already exists).

## 15. Dependency vulnerabilities

See the latest `npm audit` in the Phase 11 report. Do not `npm audit fix --force`. Next/eslint advisories that only affect the toolchain are LOW unless they ship to production bundles.

## 16. Environment variables

| Name | Client | Dev | Production | Migrations | Payments |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | required | required | — | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | required | required | — | — |
| `NEXT_PUBLIC_SITE_URL` | yes | recommended | required | — | redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | no | required | required | — | admin email lookup |
| `DATABASE_URL` | no | required | required (pooler :6543) | fallback | runtime |
| `DIRECT_DATABASE_URL` | no | for migrate | for migrate (:5432) | required | no |
| `RAZORPAY_KEY_ID` | public id only via API | optional | required to charge | — | yes |
| `RAZORPAY_KEY_SECRET` | no | optional | required to charge | — | yes |
| `RAZORPAY_WEBHOOK_SECRET` | no | optional | required | — | webhook |
| `POSTGRES_POOL_MAX` | no | optional | optional (1–8) | — | — |

## 17. Deployment prerequisites

- Vercel: Node runtime, no sticky sessions, no local disk as source of truth.
- Supabase Auth redirect URLs include `{SITE}/auth/callback`.
- Razorpay webhook → `POST /api/v1/webhooks/razorpay` (and `/api/v1/payments/webhook` if still aliased).
- Storage buckets and RLS from Phase 2 migrations.

## 18. Remaining risks

**CRITICAL:** none identified in this pass that are unmitigated in code.

**HIGH:** orphan Razorpay order if attach fails after provider create (see §7). Webhook secret misconfiguration would reject all events.

**MEDIUM:** in-memory rate limits do not span Vercel instances. Admin customer email N+1. Catalog still serializes behind pooler latency. Audit writers can miss events if insert fails.

**LOW:** CSP `'unsafe-inline'`/`'unsafe-eval'` required for Next + Razorpay. Guest cart, coupons, tax, shipping, refunds still unimplemented (product gaps, not regressions).

## 19. Recommended future work

- Durable rate limiting (Upstash / Vercel Firewall) if abuse appears.
- Reconcile orphan Razorpay orders on checkout retry with provider fetch.
- Batch Auth Admin email lookup.
- Wire remaining operational audit events (order cancel by staff if that API is added).
- Do not raise `POSTGRES_POOL_MAX` above 8 without measuring Supabase pooler usage.

## Findings recap

| ID | Severity | Topic |
| --- | --- | --- |
| Pool max:1 stall | HIGH (mitigated) | Raised default to 4 at runtime |
| No app rate limit | MEDIUM (mitigated) | Added isolate-local limits |
| No security headers | MEDIUM (mitigated) | next.config headers |
| Audit table unused | MEDIUM (partial) | Writers for catalog/inventory |
| Order list N+1 | MEDIUM (mitigated) | Batched line items |
| Provider attach gap | MEDIUM | Documented, retry via idempotency |
| In-memory rate limit | LOW | Documented |
| Customer email N+1 | MEDIUM | Documented |
