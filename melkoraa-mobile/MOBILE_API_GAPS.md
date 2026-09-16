# MELKORAA Mobile API Gaps

Backend is consumed from `https://www.melkoraa.in/api/v1` with Supabase Auth.

## Authenticated REST APIs (cookie or Bearer)

**Status:** Resolved on `melkoraa_mobile`. Protected `/api/v1/*` routes accept Supabase cookies (web) or `Authorization: Bearer <access_token>` (mobile).

## Auth deep links (password reset / email verify)

**Status:** Phase 5 wires `melkoraa://auth/callback` for Supabase email links. Recovery sessions route to reset-password; other sessions route to profile.

**Remaining:** Add the mobile redirect URL (`melkoraa://auth/callback`) in the Supabase dashboard Auth → URL configuration allow list before testing email flows in production.

## Razorpay native SDK

**Gap:** Checkout uses a **WebView** loading `checkout.razorpay.com/v1/checkout.js`. `react-native-razorpay` is not linked in Expo Go.

**Phase 5 status:** WebView origin whitelist restricted to Razorpay domains. Success screen only after `POST /payments/verify` reports `paymentStatus: paid`. Native SDK can be added in a dev-client build later.

## Guest cart

Schema supports guest carts; API docs state they are **unused**. Mobile requires sign-in for cart/wishlist/checkout.

## Public catalog (working)

`GET /health`, `/products`, `/products/:slug`, `/categories`, `/collections`, `/drops` — no auth required.

## Payment initiation

Checkout is **`POST /api/v1/checkout` only**. `POST /api/v1/payments/create-order` returns `409 USE_CHECKOUT`.

## Image URLs

`{SUPABASE_URL}/storage/v1/object/public/product-images/{productId}/{uuid}.ext` — no gap.

## Environment

Mobile needs `EXPO_PUBLIC_API_URL`, Supabase public keys, and `EXPO_PUBLIC_APP_ENV` in `melkoraa-mobile/.env` (see `.env.example`). Never commit `.env`.

## Offline / cache

No local catalog cache or offline cart sync. The app shows an offline banner and surfaces network errors; full offline shopping is out of scope for Phase 5.
