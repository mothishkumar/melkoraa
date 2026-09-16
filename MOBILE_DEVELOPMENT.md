# MELKORAA Mobile Development

This document describes how the React Native mobile app relates to the main MELKORAA web repository.

## Branch policy

| Branch | Purpose |
| --- | --- |
| `main` | Production Next.js web app, API routes, database schema, Vercel deployment |
| `melkoraa_mobile` | React Native + Expo mobile app + mobile-specific API auth boundary |

**Never merge `melkoraa_mobile` into `main` without an explicit release plan.** Production web behavior on `main` must not change as a side effect of mobile work.

## Mobile app location

```
melkoraa-mobile/
```

The mobile app is a **self-contained Expo project** with its own:

- `package.json` / `package-lock.json`
- `app.config.ts` / `app.json`
- `eas.json` (store build profiles — submit manually when ready)
- `app/` (Expo Router)
- `assets/`
- `src/api/`, `src/auth/`, `src/components/`, etc.

Do **not** add mobile dependencies to the root Next.js `package.json`.

## Stack (Phase 5)

| Item | Value |
| --- | --- |
| Expo SDK | 57 |
| React Native | 0.86.3 |
| Router | Expo Router 57 |
| iOS bundle ID | `in.melkoraa.app` |
| Android package | `in.melkoraa.app` |
| Deep link scheme | `melkoraa://` |

## API consumption

The mobile app consumes the **existing production API**:

- Base URL: `EXPO_PUBLIC_API_URL` (default `https://www.melkoraa.in/api/v1`)
- Auth: Supabase Auth SDK (SecureStore) + `Authorization: Bearer` on protected REST routes
- See `melkoraa-mobile/MOBILE_API_GAPS.md` for remaining integration notes

If a mobile feature requires a **new or changed API**, coordinate a separate backend change — do not patch APIs from the mobile branch alone without review.

## Environment

Copy `melkoraa-mobile/.env.example` to `melkoraa-mobile/.env`:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `development` or `production` |
| `EXPO_PUBLIC_API_URL` | REST API base (prod default shown) |
| `EXPO_PUBLIC_DEV_API_URL` | Optional dev override (blocked in production builds) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `EXPO_PUBLIC_SITE_URL` | Marketing / fallback web URL |

Never commit `.env`. Never put service-role keys or Razorpay secrets in Expo env.

## Local development

```bash
cd melkoraa-mobile
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm start
```

## Quality checks (mobile only)

```bash
cd melkoraa-mobile
npm run typecheck
npm run lint
npm test
npm run export
```

## Physical device QA (Phase 7)

See **`melkoraa-mobile/PHYSICAL_DEVICE_QA.md`** for LAN setup, `.env.local`, and phone connectivity.

See **`melkoraa-mobile/MOBILE_DEVICE_TEST_CHECKLIST.md`** for the Pass/Fail matrix (automated vs local API vs Android vs iOS).

| Scenario | API URL | Notes |
| --- | --- | --- |
| Catalog on real device | `https://www.melkoraa.in/api/v1` | Works today against production |
| Cart / checkout / orders | Local `melkoraa_mobile` API via LAN IP | Production returns 401 until `main` deploys Bearer (`7467fb4`) |
| Physical device | Never use `localhost` in `EXPO_PUBLIC_API_URL` | Phone resolves localhost to itself |

```bash
# Terminal 1 — API from melkoraa_mobile branch
npm run dev

# Terminal 2 — mobile app (replace with your LAN IP)
cd melkoraa-mobile
EXPO_PUBLIC_API_URL=http://192.168.x.x:4317/api/v1 npm start
```

## Store builds (not submitted from this branch)

EAS profiles in `melkoraa-mobile/eas.json`:

- `development` — dev client, internal
- `preview` — internal QA
- `production` — store-ready binary (`EXPO_PUBLIC_APP_ENV=production`)

Example:

```bash
cd melkoraa-mobile
npx eas build --profile production --platform all
```

Submit to App Store / Play Console manually when ready.

## What must not change on this branch

- Vercel configuration or production deployment targets
- DNS
- Supabase project settings (beyond documented mobile auth redirect URLs)
- Root `.env` / web environment files
- Existing web source files (unless explicitly approved for shared docs or the mobile Bearer auth boundary)
