# Physical Device QA — `melkoraa_mobile`

Prepare and run **real Android/iOS** testing against the API on this branch. Do **not** use production `www.melkoraa.in` for authenticated flows until `main` deploys Bearer auth (`7467fb4`).

## Why not `localhost` on a phone?

`localhost` / `127.0.0.1` always refers to **the device itself**, not your computer. A phone running Expo cannot reach your PC's Next.js server at `http://localhost:4317`. Use your computer's **LAN IP** on the same Wi‑Fi network instead:

```text
http://<LAN-IP>:4317/api/v1
```

Simulators/emulators on the same machine may use `http://localhost:4317/api/v1`.

---

## 1. Find your computer's LAN IP

Use **one** method for your OS. Replace `<LAN-IP>` below with the address you find (do not commit it).

| OS | Command |
| --- | --- |
| **macOS** | `ipconfig getifaddr en0` (Wi‑Fi) or check System Settings → Network |
| **Windows** | `ipconfig` → IPv4 under your active adapter |
| **Linux** | `hostname -I \| awk '{print $1}'` or `ip route get 1.1.1.1` |

Example shape only: `192.168.1.42` — yours will differ.

---

## 2. Configure the API (repo root)

From the repository root on branch `melkoraa_mobile`:

```bash
cp .env.example .env
# Set at minimum:
#   DATABASE_URL
#   DIRECT_DATABASE_URL
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY (server only)
npm install
npm run dev
```

Next.js prints:

```text
- Local:   http://localhost:4317
- Network: http://<LAN-IP>:4317
```

The **Network** URL is what your phone must reach.

### Verify API before connecting a phone

```bash
cd melkoraa-mobile
API_URL=http://localhost:4317/api/v1 npm run verify:local-api
# When API is up, also test the LAN URL from your PC:
API_URL=http://<LAN-IP>:4317/api/v1 npm run verify:local-api
```

Expected boundary (automated script):

| Endpoint | Expected |
| --- | --- |
| `GET /health` | 200 |
| `GET /products` | 200 |
| `GET /auth/me` (no auth) | 401 |
| `GET /auth/me` (invalid Bearer) | 401 |
| `GET /cart`, `/wishlist`, `/orders` (no auth) | 401 |

Valid Bearer + cart/checkout success requires a **real Supabase sign-in** on device (manual checklist).

---

## 3. Configure the mobile app

```bash
cd melkoraa-mobile
cp .env.example .env
cp .env.local.example .env.local
```

### Environment file precedence (Expo)

Expo loads (later files override earlier):

1. `.env`
2. `.env.local` ← **put machine-specific LAN URL here**
3. `.env.development` / `.env.development.local` (if present)

**`.env.local` is gitignored** — safe for per-developer LAN IPs.

Example `.env.local` (use your `<LAN-IP>`, never commit the real value):

```env
EXPO_PUBLIC_API_URL=http://<LAN-IP>:4317/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Keep shared defaults in `.env`; override only on your machine in `.env.local`.

---

## 4. Start Expo and connect the phone

```bash
cd melkoraa-mobile
npm install
npm start
```

1. Phone and PC on the **same Wi‑Fi** (avoid guest/isolated AP).
2. Scan the QR code with **Expo Go** (or open the dev client).
3. If the app cannot load catalog data, confirm firewall allows inbound **TCP 4317** on your PC.

### Confirm the phone can hit the API

From the phone's browser (optional sanity check):

```text
http://<LAN-IP>:4317/api/v1/health
```

Should return JSON with `"status":"ok"`. If this fails, fix network/firewall before debugging the app.

---

## 5. What to test on hardware

Use **`MOBILE_DEVICE_TEST_CHECKLIST.md`** — mark Pass/Fail/Notes per row. Sections:

| Section | API required |
| --- | --- |
| Catalog | Local or prod (public) |
| Auth, cart, wishlist, addresses, checkout, orders | **Local `melkoraa_mobile` API only** |
| Razorpay | Local API + test keys |
| Deep links | Supabase allow-list for `melkoraa://auth/callback` |

**Agent/automation did not run physical device tests** — checklist Android/iOS columns are blank until you fill them.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Catalog empty / network error | Wrong `EXPO_PUBLIC_API_URL`, firewall, or not on same Wi‑Fi |
| Sign-in works but cart 401 | Phone still pointing at production API |
| `localhost` in env on device | Phone resolves to itself — use `<LAN-IP>` |
| `/products` 500 on local API | Root `.env` missing `DATABASE_URL` |
| Password reset link opens web only | Add `melkoraa://auth/callback` in Supabase dashboard |

---

## Scope limits (Phase 7)

- No Vercel / production deploy / store submit
- No changes to `in.melkoraa.app` or `melkoraa://`
- No backend architecture changes on this phase
