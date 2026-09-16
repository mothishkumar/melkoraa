# MELKORAA Mobile API Gaps

This document records backend/API limitations discovered while building the React Native client against the **read-only** production web/API codebase. The mobile app does **not** modify the backend.

## Critical: authenticated REST APIs use cookie sessions only

**Gap:** All protected `/api/v1/*` routes authenticate via Supabase **HTTP cookies** set by the Next.js server (`src/lib/supabase/server.ts` + `requireApiAuth()`). There is **no** `Authorization: Bearer <access_token>` handling in the API layer today.

**Impact:** The mobile client stores Supabase sessions in `expo-secure-store` and sends `Authorization: Bearer` on authenticated API calls, but cart, wishlist, orders, checkout, addresses, and `GET /auth/me` will return **401 UNAUTHENTICATED** until the backend accepts Bearer tokens (or a dedicated mobile auth bridge).

**Phase 2 app behavior:**
- **Cart tab:** Shows `LoginRequired` when unsigned in. Signed-in users who receive 401 see the same state with an API note — no fake cart data.
- **Wishlist:** Heart on product cards prompts sign-in when unsigned in. `/wishlist` screen shows `LoginRequired` on 401.
- **Add to bag (PDP):** Attempts `cartApi.addItem`; on 401 alerts and routes to sign-in.
- **Profile:** Login-required shell; `GET /auth/me` may fail with 401 even when Supabase session exists.

**Recommended backend change (future):** In `getCurrentUser()` / API guard, accept `Authorization: Bearer` and validate the Supabase JWT with the anon client, alongside existing cookie sessions.

## No REST login/register/forgot/refresh endpoints

**Not a gap for mobile:** Auth is intentionally via **Supabase Auth SDK** (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `refreshSession`). The only REST auth routes are:

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

## Password reset deep link is web-oriented

**Gap:** `resetPasswordForEmail` redirect targets `{SITE_URL}/auth/callback?next=/reset-password` (Next.js web flow). Native apps need a custom URL scheme (`melkoraa://`) registered in Supabase redirect allow-list and a mobile reset-password screen wired to `updateUser({ password })`.

**Phase 2 status:** Forgot-password sends the email via Supabase; completing reset in-app is deferred.

## Email verification deep link is web-oriented

**Gap:** Signup confirmation links point to the web `/auth/callback` route. Mobile should add scheme/deep-link handling in a later phase.

## Payment initiation path

**Not missing:** Checkout is **`POST /api/v1/checkout`** only. `POST /api/v1/payments/create-order` intentionally returns `409 USE_CHECKOUT`.

**Gap for mobile:** Razorpay native SDK integration is not started. `checkoutApi` + `verifyPayment` are wired; UI and Razorpay React Native checkout are deferred (Phase 3+).

## Guest cart

**Gap:** Schema supports guest `session_id` carts, but API docs state guest carts are **unused**. Mobile requires sign-in for cart/wishlist/checkout.

## Image URLs

**No gap:** Product images are absolute public Supabase Storage URLs:

`{SUPABASE_URL}/storage/v1/object/public/product-images/{productId}/{uuid}.ext`

## Public catalog (Phase 2 — working)

These endpoints work without authentication from mobile:

- `GET /health`
- `GET /products`, `GET /products/:slug`
- `GET /categories`, `GET /collections`, `GET /drops`, `GET /drops/:slug`

## Admin APIs

**Out of scope:** `/api/v1/admin/*` exists but is not exposed in the consumer mobile shell.

## Environment variables

Mobile needs Supabase **public** keys for auth (mirrors web `NEXT_PUBLIC_SUPABASE_*`). These are not secrets but are separate from `EXPO_PUBLIC_API_URL`.
