# MELKORAA — Next.js → React (Vite) + Express Migration Map

**Branch:** `melkoraa_spa`  
**Date:** 2026-09-16  
**Status:** In progress (Phase 1 complete; Phases 2–12 implemented in `frontend/` + `backend/`)

The existing Next.js 16 App Router application under `src/` remains **untouched** except `tsconfig.json` excludes for `frontend/` and `backend/`. Production Vercel deployment continues to serve the Next app.

---

## Phase 1 — Audit (CURRENT NEXT)

### Routes (storefront journey)

| Next route | File | SPA route |
| --- | --- | --- |
| `/` | `src/app/(store)/page.tsx` | `/` |
| `/drop-001` | `src/app/(store)/drop-001/page.tsx` | `/drop-001` |
| `/products` | `src/app/(store)/products/page.tsx` | `/products` |
| `/products/[slug]` | `src/app/(store)/products/[slug]/page.tsx` | `/products/:slug` |
| `/cart` | `src/app/(store)/cart/page.tsx` | `/cart` |
| `/checkout` | `src/app/(store)/checkout/page.tsx` | `/checkout` |
| `/order/[orderId]` | `src/app/(store)/order/[orderId]/page.tsx` | `/order/:orderId` |
| `/login` | `src/app/(auth)/login/page.tsx` | `/login` |
| `/register` | `src/app/(auth)/register/page.tsx` | `/register` |
| `/verify-email` | `src/app/(auth)/verify-email/page.tsx` | `/verify-email` |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | `/forgot-password` |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | `/reset-password` |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Express `GET /api/v1/auth/callback` |

Redirects (`next.config.ts`): `/shop` → `/products`, `/product/:slug` → `/products/:slug`, collection aliases → `/drop-001` — replicated in React Router.

### API surface (reuse contracts)

All REST under `/api/v1/*` — 52 handlers in `src/app/api/v1/`. Express backend re-implements the same paths, calling existing `src/server/services/*` and repositories.

**Journey-critical endpoints:**

| Method | Path | Next handler | Express |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | `health/route.ts` | `backend/src/routes/health.ts` |
| POST | `/api/v1/auth/register` | *(server action)* | `backend/src/routes/auth.ts` |
| POST | `/api/v1/auth/login` | *(server action)* | `backend/src/routes/auth.ts` |
| POST | `/api/v1/auth/logout` | `auth/logout/route.ts` | `backend/src/routes/auth.ts` |
| GET | `/api/v1/auth/me` | `auth/me/route.ts` | `backend/src/routes/auth.ts` |
| POST | `/api/v1/auth/resend-verification` | *(server action)* | `backend/src/routes/auth.ts` |
| GET | `/api/v1/auth/callback` | `auth/callback/route.ts` | `backend/src/routes/auth.ts` |
| GET | `/api/v1/products` | `products/route.ts` | `backend/src/routes/products.ts` |
| GET | `/api/v1/products/:slug` | `products/[slug]/route.ts` | `backend/src/routes/products.ts` |
| GET | `/api/v1/drops/:slug` | `drops/[slug]/route.ts` | `backend/src/routes/drops.ts` |
| GET/DELETE | `/api/v1/cart` | `cart/route.ts` | `backend/src/routes/cart.ts` |
| POST/PATCH/DELETE | `/api/v1/cart/items/*` | `cart/items/*` | `backend/src/routes/cart.ts` |
| GET/POST | `/api/v1/addresses` | `addresses/route.ts` | `backend/src/routes/addresses.ts` |
| POST | `/api/v1/checkout` | `checkout/route.ts` | `backend/src/routes/checkout.ts` |
| POST | `/api/v1/payments/verify` | `payments/verify/route.ts` | `backend/src/routes/payments.ts` |
| GET | `/api/v1/orders/:orderId` | `orders/[orderId]/route.ts` | `backend/src/routes/orders.ts` |
| POST | `/api/v1/webhooks/razorpay` | `webhooks/razorpay/route.ts` | `backend/src/routes/webhooks.ts` |

Admin APIs deferred to a later SPA phase; Next `/admin` remains authoritative.

### Auth (current)

| Concern | Next implementation |
| --- | --- |
| Transport | Supabase cookie session via `@supabase/ssr` |
| Session refresh | `src/proxy.ts` (Next 16 proxy, not `middleware.ts`) |
| Register/login | Server Actions in `src/features/auth/actions.ts` |
| Guards | `requireAuth`, `requireApiAuth`, protected paths in `src/lib/auth/paths.ts` |
| Roles | `customer` / `staff` / `manager` / `admin` in `profiles` |

**SPA auth:** Express sets httpOnly Supabase cookies; React never stores tokens in `localStorage`. Session via `GET /api/v1/auth/me` + `credentials: 'include'`.

### Cart / checkout / payments

| Step | Current |
| --- | --- |
| Cart | Auth-only; `cart-service` → `/api/v1/cart/*` |
| Add to bag (collection) | `AddToBagButton` stays on page + `BagToast` (Zustand) |
| Empty-bag checkout fix | `CheckoutClient` re-fetches authoritative cart before pay |
| Checkout | `POST /api/v1/checkout` + idempotency key in `sessionStorage` |
| Payment | Razorpay modal → `POST /api/v1/payments/verify` |
| Webhook | `POST /api/v1/webhooks/razorpay` |

### Components to port (storefront)

| Next path | SPA path |
| --- | --- |
| `src/components/layout/*` | `frontend/src/components/layout/*` |
| `src/components/cart/*` | `frontend/src/components/cart/*` |
| `src/components/product/*` | `frontend/src/components/product/*` |
| `src/components/ui/*` | `frontend/src/components/ui/*` |
| `src/features/checkout/*` | `frontend/src/features/checkout/*` |
| `src/features/auth/components/*` | `frontend/src/features/auth/*` |
| `src/hooks/*` | `frontend/src/hooks/*` |
| `src/lib/api/*` | `frontend/src/lib/api/*` (API base URL prefix) |
| `src/types/*` | `frontend/src/types/*` |
| `src/app/globals.css` | `frontend/src/styles/globals.css` |

**Adaptations:** `next/link` → `react-router-dom` `Link`; `next/image` → `<img>`; `next/navigation` → `useNavigate`/`useLocation`; server actions → REST auth endpoints; RSC data loaders → `useEffect` + API or route loaders.

### Env (split)

| Variable | Next (`.env`) | Backend (`backend/.env`) | Frontend (`frontend/.env`) |
| --- | --- | --- | --- |
| Supabase URL/anon | `NEXT_PUBLIC_*` | `NEXT_PUBLIC_SUPABASE_*` | — (not needed; cookies via API) |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` | same | — |
| Database | `DATABASE_URL` | same | — |
| Razorpay | `RAZORPAY_*` | same | — |
| Site URL | `NEXT_PUBLIC_SITE_URL` | `SITE_URL` (frontend origin for email links) | — |
| API URL | — | `PORT`, `CORS_ORIGIN` | `VITE_API_URL` |

### Middleware → Express

| Next `src/proxy.ts` | SPA |
| --- | --- |
| Session cookie refresh | Express auth middleware on each request |
| Protected routes redirect | React `ProtectedRoute` + API 401 |
| Admin staff gate | Deferred (admin stays on Next) |

### Images / toasts

| Concern | Current | SPA |
| --- | --- | --- |
| Product images | Supabase CDN URLs | `<img src={url}>` |
| Logo | `BrandMark` text mark (`brand.name`) | Same component |
| Bag toast | `use-ui-store.ts` + `bag-toast.tsx` | Ported unchanged |
| Home scroll lock | `use-intro-scroll-lock.ts` until SHOP DROP 01 | Ported unchanged |

---

## Phase 2 — Backend scaffold

- `backend/package.json` — Express, cors, cookie-parser, tsx
- `backend/tsconfig.json` — paths `@/*` → `../src/*`
- `backend/src/index.ts` — HTTP server
- `backend/src/app.ts` — middleware + `/api/v1` router
- `backend/.env.example`

## Phase 3 — Express auth + Supabase cookies

- `backend/src/lib/supabase.ts` — `@supabase/ssr` with Express req/res cookies
- `backend/src/middleware/auth.ts` — `requireAuth`, profile load
- `backend/src/routes/auth.ts` — register, login, logout, me, resend, callback

## Phase 4 — Express catalog routes

- Products, drops, collections, categories (public GET)

## Phase 5 — Express cart routes

- Full cart CRUD mirroring Next handlers

## Phase 6 — Express checkout + payments

- Checkout, payment verify, Razorpay webhook, orders GET

## Phase 7 — Express addresses

- List/create for checkout

## Phase 8 — Frontend scaffold

- Vite + React 19 + TypeScript + Tailwind v4
- React Router v7
- `frontend/.env.example` with `VITE_API_URL`

## Phase 9 — Frontend layout + design tokens

- Port `globals.css`, fonts, `StoreHeader`/`StoreFooter`/`BrandMark`

## Phase 10 — Frontend pages (journey)

- Home (scroll lock), Drop 001, Product, Cart, Checkout, Order, Auth pages

## Phase 11 — Frontend API client + auth context

- `credentials: 'include'` fetch wrapper
- `AuthProvider` from `/api/v1/auth/me`

## Phase 12 — Integration + verification

- `tsconfig.json` exclude `frontend`, `backend`
- Lint, typecheck, build both packages
- E2E journey: HOME → DROP 01 → PRODUCT → ADD TO BAG → CART → CHECKOUT → PAYMENT → ORDER

---

## Eventually deletable (post cutover)

| Path | When |
| --- | --- |
| `src/app/(store)/*` | After SPA is production storefront |
| `src/app/(auth)/*` | After SPA auth is live |
| `src/app/api/v1/*` (storefront subset) | After Express is production API |
| `src/proxy.ts` | After Next decommissioned |
| `src/features/auth/actions.ts` | Replaced by Express auth routes |

**Keep until admin migrates:** `src/app/admin/*`, admin API routes, Drizzle schema/migrations.

---

## Run commands

```bash
# Terminal 1 — API (port 4318)
cd backend && cp .env.example .env   # fill from root .env
npm install && npm run dev

# Terminal 2 — SPA (port 5173)
cd frontend && cp .env.example .env
npm install && npm run dev

# Next.js (unchanged, port 4317)
npm run dev
```

## Build

```bash
cd backend && npm run build
cd frontend && npm run build
```

---

*Detailed route/API inventory: see `internal/migration-audit/nextjs-app-audit.md` in Project store.*
