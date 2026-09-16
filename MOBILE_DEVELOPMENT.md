# MELKORAA Mobile Development

This document describes how the React Native mobile app relates to the main MELKORAA web repository.

## Branch policy

| Branch | Purpose |
| --- | --- |
| `main` | Production Next.js web app, API routes, database schema, Vercel deployment |
| `melkoraa_mobile` | React Native + Expo mobile app only |

**Never merge `melkoraa_mobile` into `main` without an explicit release plan.** Production web behavior on `main` must not change as a side effect of mobile work.

## Mobile app location

```
melkoraa-mobile/
```

The mobile app is a **self-contained Expo project** with its own:

- `package.json` / `package-lock.json`
- `tsconfig.json`
- `app/` (Expo Router)
- `assets/`
- `src/api/`, `src/auth/`, `src/components/`, etc.

Do **not** add mobile dependencies to the root Next.js `package.json`.

## API consumption

The mobile app consumes the **existing production API** — no backend rewrite:

- Base URL: `https://www.melkoraa.in/api/v1`
- Auth: Supabase Auth SDK (client-side) + REST where documented
- See `melkoraa-mobile/MOBILE_API_GAPS.md` for known mobile integration gaps (e.g. Bearer token support for protected routes)

If a mobile feature requires a **new or changed API**, stop and coordinate a separate backend change on `main` — do not patch APIs from the mobile branch alone.

## Local development

```bash
cd melkoraa-mobile
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm start
```

## What must not change on this branch

- Vercel configuration or production deployment targets
- DNS
- Supabase project settings
- Root `.env` / web environment files
- Existing web/API source files (unless explicitly approved for a shared doc like this file)
