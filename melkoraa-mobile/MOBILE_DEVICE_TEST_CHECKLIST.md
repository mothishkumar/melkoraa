# MELKORAA Mobile Device Test Checklist

Branch: `melkoraa_mobile`  
Bundle IDs: `in.melkoraa.app` (iOS + Android)  
Deep link scheme: `melkoraa://`  
Setup guide: **`PHYSICAL_DEVICE_QA.md`**

---

## A. Automated checks (CI / agent — not physical devices)

Last run: 2026-09-16 (cloud agent). **Does not substitute for hardware QA.**

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | **Pass** | |
| `npm run lint` | **Pass** | |
| `npm test` | **Pass** | API client Bearer / 401-retry unit tests |
| `npx expo export --platform web` | **Pass** | 28 static routes |
| `npm run verify:local-api` (localhost) | **Partial** | health 200, auth/cart 401; `/products` needs root `DATABASE_URL` |
| Physical Android | **Not performed** | |
| Physical iOS | **Not performed** | |

---

## B. Local API verification (`melkoraa_mobile` branch)

Run on your PC **before** handing a phone to testers. Uses `npm run verify:local-api` — pass `API_URL` or `EXPO_PUBLIC_API_URL`; **never hardcode an IP in the repo**.

```bash
# Terminal 1 (repo root)
npm run dev

# Terminal 2
cd melkoraa-mobile
API_URL=http://localhost:4317/api/v1 npm run verify:local-api
API_URL=http://<LAN-IP>:4317/api/v1 npm run verify:local-api
```

| Endpoint | Expected | Agent (localhost) | Your LAN run |
| --- | --- | --- | --- |
| `GET /health` | 200 | Pass | |
| `GET /products` | 200 | Fail (no DB in agent) | |
| `GET /auth/me` no auth | 401 | Pass | |
| `GET /auth/me` invalid Bearer | 401 | Pass | |
| `GET /cart` no auth | 401 | Pass | |
| `GET /wishlist` no auth | 401 | Pass | |
| `GET /orders` no auth | 401 | Pass | |
| Valid Bearer → `/auth/me` 200 | Manual | Not run (needs Supabase login) | |
| Valid Bearer → cart CRUD | Manual | Not run | |

Production `www.melkoraa.in` still returns **401 on protected routes** until `main` deploys Bearer (`7467fb4`). Use local API for authenticated device QA.

---

## C. Android physical device (manual — fill Pass/Fail/Notes)

Phone env: `.env.local` with `EXPO_PUBLIC_API_URL=http://<LAN-IP>:4317/api/v1`  
**Not tested by agent.**

### Environment & network

| Test | Pass/Fail | Notes |
| --- | --- | --- |
| Expo Go / dev client launches | | |
| Phone browser opens `http://<LAN-IP>:4317/api/v1/health` | | |
| App loads catalog from LAN API | | |
| Offline banner when Wi‑Fi off | | |
| No tokens in Metro logs | | |

### Auth

| Test | Pass/Fail | Notes |
| --- | --- | --- |
| Sign in | | |
| Session restore after kill + reopen | | |
| Sign out | | |
| Profile / `GET /auth/me` | | |
| `melkoraa://auth/callback` from email | | |

### Catalog

| Test | Pass/Fail | Notes |
| --- | --- | --- |
| Home / shop / PDP / search / category | | |

### Cart & wishlist

| Test | Pass/Fail | Notes |
| --- | --- | --- |
| Add to bag | | |
| Pending action after login | | |
| Cart remove | | |
| Wishlist toggle + list | | |

### Addresses & checkout

| Test | Pass/Fail | Notes |
| --- | --- | --- |
| Address CRUD | | |
| Checkout totals from server | | |
| Razorpay WebView opens | | |
| Dismiss WebView — no false success | | |
| Success only after `/payments/verify` paid | | |

### Orders

| Test | Pass/Fail | Notes |
| --- | --- | --- |
| Orders list / detail | | |
| Cancel pending order | | |

---

## D. iOS physical device (manual — fill Pass/Fail/Notes)

Same env and API URL as Android section C. **Not tested by agent.**

| Area | Pass/Fail | Notes |
| --- | --- | --- |
| Environment & network (mirror section C) | | |
| Auth | | |
| Catalog | | |
| Cart & wishlist | | |
| Addresses & checkout / Razorpay | | |
| Orders | | |

---

## Known gaps

See `MOBILE_API_GAPS.md` — production Bearer deploy, Razorpay WebView only, Supabase `melkoraa://` allow-list.
