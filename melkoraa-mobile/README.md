# MELKORAA Mobile

React Native + Expo + TypeScript consumer app for [melkoraa.in](https://www.melkoraa.in). This project is independent of the Next.js web app and consumes existing `/api/v1` REST endpoints.

**Phase 2** adds the public shopping UX: Home, Shop, PDP, Search, Categories, cart/wishlist shells with login-required states for protected APIs.

## Setup

```bash
cd melkoraa-mobile
cp .env.example .env
cp .env.local.example .env.local
# .env — shared defaults; .env.local — your LAN API URL (gitignored)
# EXPO_PUBLIC_API_URL=http://<LAN-IP>:4317/api/v1 for physical device QA
npm install
```

Physical device testing: **`PHYSICAL_DEVICE_QA.md`**

## Run

```bash
npm start
```

Then press `a` for Android emulator, `i` for iOS simulator (macOS), or scan the QR code with Expo Go.

## Scripts

```bash
npm run lint
npm test
npx tsc --noEmit
```

## Architecture

- `app/` — Expo Router (tabs: Home, Shop, Cart, Profile; stack: PDP, Search, Category, Wishlist)
- `src/api/` — centralized API client (no raw `fetch` in screens)
- `src/services/` — cart/catalog/wishlist wrappers with 401 handling
- `src/hooks/` — data hooks for screens
- `src/components/` — reusable UI + catalog components
- `src/theme/` — design tokens
- `src/auth/` — Supabase auth + `expo-secure-store` session persistence

See `MOBILE_API_GAPS.md` for known backend/mobile integration gaps.
