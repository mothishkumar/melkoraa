# MELKORAA Mobile API Gaps

Backend is **read-only** from the mobile branch. The app consumes `https://www.melkoraa.in/api/v1` and Supabase Auth.

## Authenticated REST APIs (cookie or Bearer)

**Status:** Resolved on `melkoraa_mobile`. Protected `/api/v1/*` routes accept **either** Supabase HTTP cookies (web) **or** `Authorization: Bearer <access_token>` (mobile). `getCurrentUser()` / `requireApiAuth()` resolve the same Supabase user identity from both mechanisms.

**Mobile behavior:**
- Sends `Authorization: Bearer <access_token>` on protected API calls.
- Refresh-on-401 + single retry; invalid/expired tokens return **401 UNAUTHENTICATED**.
- Cart, wishlist, checkout, addresses, orders, and `GET /auth/me` use the authenticated user from the JWT — never a body `userId`.

## Auth deep links (password reset / email verify)

**Gap:** Supabase `resetPasswordForEmail` and signup links target web `{SITE_URL}/auth/callback`. Mobile scheme `melkoraa://` is registered in `app.json` but **not** wired to exchange PKCE codes in-app.

**Phase 3 status:** Forgot-password sends email via Supabase. In-app `reset-password` screen supports `updateUser({ password })` when a recovery session exists. Completing reset from email on device requires deep-link handling (future).

## Razorpay native SDK

**Gap:** Checkout uses a **WebView** loading `checkout.razorpay.com/v1/checkout.js` (mirrors web). `react-native-razorpay` is not linked in Expo Go.

**Phase 4 status:** Payment opens WebView modal → user pays → app calls `POST /payments/verify` → success screen only when server reports `paymentStatus: paid`. Native SDK can be added in a dev-client build later.

## Guest cart

Schema supports guest carts; API docs state they are **unused**. Mobile requires sign-in for cart/wishlist/checkout.

## Public catalog (working)

`GET /health`, `/products`, `/products/:slug`, `/categories`, `/collections`, `/drops` — no auth required.

## Payment initiation

Checkout is **`POST /api/v1/checkout` only**. `POST /api/v1/payments/create-order` returns `409 USE_CHECKOUT`.

## Image URLs

`{SUPABASE_URL}/storage/v1/object/public/product-images/{productId}/{uuid}.ext` — no gap.

## Environment

Mobile needs `EXPO_PUBLIC_API_URL` and Supabase public keys in `melkoraa-mobile/.env` (see `.env.example`). Never commit `.env`.
