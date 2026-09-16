# MELKORAA Mobile Device Test Checklist

Branch: `melkoraa_mobile`  
Bundle IDs: `in.melkoraa.app` (iOS + Android)  
Deep link scheme: `melkoraa://`  
Last automated validation: 2026-09-16 (CI/agent — **not** physical devices)

## Before you test on a device

1. Copy `melkoraa-mobile/.env.example` → `.env`
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Choose API target:
   - **Production catalog only:** `EXPO_PUBLIC_API_URL=https://www.melkoraa.in/api/v1`
   - **Full authenticated flow (cart, checkout, orders):** run the API locally from `melkoraa_mobile` (includes Bearer auth, commit `7467fb4`) and point the device at your machine's **LAN IP**, e.g. `EXPO_PUBLIC_API_URL=http://192.168.x.x:4317/api/v1`
4. **Do not use `localhost` on a physical phone** — it refers to the phone itself
5. Add `melkoraa://auth/callback` to Supabase Auth → URL configuration before testing password-reset email links
6. Start Expo: `cd melkoraa-mobile && npm start` then scan QR / run dev client

### Production API Bearer blocker

`https://www.melkoraa.in` is deployed from `main`, which **does not yet include** Bearer auth (`7467fb4` on `melkoraa_mobile` only). Until that ships, protected mobile routes (`/auth/me`, cart, wishlist, checkout, orders) will return **401** against production even with a valid Supabase session.

| Target | Public catalog | Bearer-protected APIs |
| --- | --- | --- |
| `www.melkoraa.in` (prod) | Works | **401 expected** until main deploys Bearer |
| Local API on `melkoraa_mobile` | Works | Works with valid Supabase JWT |

---

## Automated checks (agent-run)

These were executed in the cloud agent environment on 2026-09-16. They validate configuration and client behavior — **not** real Android/iOS hardware.

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | **Pass** | |
| `npm run lint` | **Pass** | |
| `npm test` | **Pass** | Includes API client Bearer/401-retry tests |
| `npx expo export --platform web` | **Pass** | 28 static routes |
| Prod `GET /api/v1/health` | **Pass** | HTTP 200 |
| Prod `GET /api/v1/products` | **Pass** | HTTP 200, public catalog |
| Prod `GET /api/v1/auth/me` (no auth) | **Pass** | HTTP 401 (expected) |
| Prod `GET /api/v1/auth/me` (invalid Bearer) | **Pass** | HTTP 401 |
| Prod Bearer cart/checkout with real JWT | **Not run** | Blocked: prod lacks Bearer; no device credentials in agent |
| Physical Android device | **Not performed** | Requires manual QA |
| Physical iOS device | **Not performed** | Requires manual QA |

---

## Manual device checklist

Mark each row after testing on hardware. Leave blank until tested — do not assume pass.

### Environment & connectivity

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| App launches via Expo Go / dev client | | | |
| `.env` Supabase keys load; no crash on startup | | | |
| Production API URL loads catalog (shop/home) | | | |
| LAN/local API URL works when phone on same Wi‑Fi | | | |
| Offline banner appears when network disabled | | | |
| No tokens or secrets visible in Metro/device logs | | | |

### Auth

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| Sign in with email/password | | | Requires Bearer-capable API |
| Session restores after app restart (SecureStore) | | | |
| Sign out clears session | | | |
| `GET /auth/me` returns profile | | | Requires Bearer-capable API |
| Forgot password email sends | | | |
| `melkoraa://auth/callback` opens app from email link | | | Supabase allow-list required |
| Reset password completes in-app | | | |

### Catalog (public — works against prod)

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| Home feed loads collections/products | | | |
| Shop list + pagination | | | |
| Product detail (variants, images) | | | |
| Search | | | |
| Category filter | | | |

### Cart & wishlist

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| Add to bag (signed in) | | | Requires Bearer-capable API |
| Pending add-to-bag replays after login | | | |
| Cart list / remove item | | | |
| Wishlist toggle + list screen | | | |
| 401 after expired session → sign-in prompt | | | |

### Addresses & checkout

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| List / add / remove address | | | Requires Bearer-capable API |
| Checkout shows server totals | | | |
| Pay now opens Razorpay WebView | | | Test mode keys on local API |
| Dismiss WebView returns to checkout (no false success) | | | |
| Success screen **only** after `POST /payments/verify` returns paid | | | |
| Idempotent re-checkout does not duplicate order | | | |

### Orders

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| Orders list | | | Requires Bearer-capable API |
| Order detail | | | |
| Cancel pending unpaid order | | | |

### Deep links & IDs

| Test | Android | iOS | Notes |
| --- | --- | --- | --- |
| App scheme `melkoraa://` registered | | | |
| Auth callback deep link routes correctly | | | |
| Bundle ID / package `in.melkoraa.app` in build settings | | | EAS profile |

---

## Recommended test matrix

| Goal | `EXPO_PUBLIC_API_URL` | API branch |
| --- | --- | --- |
| Catalog UX on real device | `https://www.melkoraa.in/api/v1` | prod (`main`) |
| Full commerce flow | `http://<LAN-IP>:4317/api/v1` | local `melkoraa_mobile` |
| Store candidate build | `https://www.melkoraa.in/api/v1` | prod after Bearer deploy |

---

## Known gaps (see `MOBILE_API_GAPS.md`)

- Production Bearer auth pending `main` merge/deploy of `7467fb4`
- Razorpay WebView only (no native SDK)
- No offline catalog cache
- Supabase dashboard must allow `melkoraa://auth/callback`
