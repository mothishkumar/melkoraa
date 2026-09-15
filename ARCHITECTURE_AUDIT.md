# MELKORAA — Architecture Audit (Phase 0)

**Date:** 2026-09-15  
**Repository state:** empty greenfield (root commit only)  
**Current branch:** `main`  
**Root commit:** `a02a649 Initialize project`  
**Auditor role:** lead architect / senior full-stack engineer  

This document is the **Phase 0** deliverable. It inspects the existing repository only. It does **not** implement schema, APIs, UI, or Supabase configuration.

---

## 1. Current project structure

The working tree contains **no application source**.

Observed layout:

```
/workspace
└── .git/
```

There is **no**:

- `apps/`
- `packages/`
- `src/`
- `app/`
- `public/`
- `package.json`
- `pnpm-workspace.yaml` / `turbo.json` / `nx.json`
- `README.md` or other documentation
- `.env.example`
- CI config (`.github/`)
- Next.js, Drizzle, or Supabase directories

**Conclusion:** this is a new project with an empty Git history, not an existing ecommerce codebase. There is nothing to preserve, rewrite, or deduplicate yet.

---

## 2. Existing dependencies

**None.**

No `package.json`, lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`), or language toolchain files (`tsconfig.json`, `pyproject.toml`, `.csproj`, etc.).

No installed `node_modules`.

**Implication:** the stack must be introduced from scratch. Target stack from product brief (not yet present in repo):

| Layer | Intended |
| --- | --- |
| App | Next.js (App Router), React, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Framer Motion, Lucide |
| Data | Supabase PostgreSQL, Drizzle ORM |
| Auth / storage | Supabase Auth, Supabase Storage |
| Validation / forms | Zod, React Hook Form |
| Client state | Zustand (only where required) |
| Payments | Razorpay behind a gateway interface |
| Deploy | Vercel + GitHub |

**Explicitly excluded (per brief):** ASP.NET Core, C#, Entity Framework, Npgsql, ASP.NET Identity.

---

## 3. Existing Next.js setup

**None.**

No `next.config.*`, no App Router or Pages Router, no `src/app`, no Route Handlers, no middleware, no `next-env.d.ts`.

**Implication:** Next.js must be scaffolded in a later phase. There is no existing routing, metadata, or server/client split to audit.

---

## 4. Existing database code

**None.**

No Drizzle schema, no SQL migrations, no seed scripts, no Prisma/EF models, no duplicate catalog schemas.

**Implication:** Phase 3 (schema) and Phase 4 (RLS) will be first-time creation, not a migration of existing tables. There is no risk of duplicate schemas **today**; that risk only appears if later work is duplicated.

---

## 5. Existing Supabase configuration

**None.**

No `supabase/` directory, no `config.toml`, no generated types, no client factories (`createBrowserClient` / `createServerClient`), no `.env.example` placeholders.

Environment variables required by the brief are **not** present in the repo (correct for secrets; placeholders also missing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Implication:** Phase 2 must add project config, SSR auth clients, storage buckets, and `.env.example` with placeholders only. Service role must never be `NEXT_PUBLIC_*`.

---

## 6. Existing UI

**None.**

No storefront, no admin UI, no design tokens, no brand assets, no pages (`/`, `/shop`, `/product/[slug]`, `/admin`, etc.).

**Implication:** customer and admin surfaces will be greenfield in Phases 11–12. Design language from the brief (premium dark editorial streetwear) has no existing CSS to conflict with.

---

## 7. Existing API

**None.**

No `/api/v1` Route Handlers, no Server Actions, no OpenAPI spec, no payment webhooks.

**Implication:** catalog, cart, inventory, orders, payments, and admin APIs will be first-time implementation in Phases 6–10 and 12.

---

## 8. Existing authentication

**None.**

No Supabase Auth integration, no middleware session refresh, no role tables, no admin authorization checks.

**Implication:** Phase 5 introduces email/password, verification, reset, and SSR sessions. Roles (`user`, `admin`, `manager`, `staff`) must be stored and enforced **server-side**, never trusted from the browser.

---

## 9. Problems

These are **absence / greenfield risks**, not defects in existing code.

| ID | Problem | Severity | Notes |
| --- | --- | --- | --- |
| P0 | Empty repository | Info | Expected for New Project flow. No working code to preserve. |
| P1 | No package manager or monorepo convention | Medium | Must choose `pnpm` + `apps/store` + `apps/admin` vs single Next.js app with `/admin` route group before scaffolding. |
| P2 | No local/dev environment contract | High | Without `.env.example` and documented Supabase/Razorpay mock fallbacks, later phases cannot run in this Cloud Agent VM. |
| P3 | Inventory and payments are concurrency-critical | High | Must not be implemented as naive SELECT-then-UPDATE. Requires Postgres transactions/RPC from Phase 7/10. |
| P4 | Dual-app vs route-group decision deferred | Medium | Two Next.js apps increase shared-package cost; a single app with `(store)` and `(admin)` route groups is simpler for an empty repo. |
| P5 | RLS + service role misuse is a common failure mode | High | No clients exist yet; the first client split must enforce server-only `SERVICE_ROLE_KEY`. |
| P6 | Guest cart merge, edition numbering, and webhook idempotency | High | Domain complexity is specified but unimplemented. Easy to get wrong if UI is built before domain services. |
| P7 | No tests, logging, or SEO baseline | Medium | Expected; must be planned so they are not bolted on after UI. |
| P8 | Cloud Agent has no live Supabase/Razorpay project | High | Schema, RLS, and payments need either a provisioned project or a documented local/mock path. |

There are **no** duplicate schemas, duplicate Supabase clients, or legacy C#/.NET code to remove.

---

## 10. Recommended architecture

Because the repository is empty and the brief allows either a monorepo or a single Next.js app plus admin route group, **recommend a single Next.js App Router application** with route groups, not two apps.

**Rationale:**

- One Vercel project, one middleware chain, one env contract.
- Shared Drizzle schema, payment service, and auth helpers without publishing internal packages on day one.
- Admin remains a separate *product surface* (`/admin`) with server-side authorization, matching the brief.
- Can split into `apps/store` + `apps/admin` later if deploy/auth boundaries require it.

### Proposed layout (to be created in Phase 1, not now)

```
/
  apps/                         # optional later; not required for v1
  src/
    app/
      (store)/                  # customer site
        page.tsx                # /
        shop/
        collection/[slug]/
        product/[slug]/
        about/
        journal/
        cart/
        checkout/
        account/...
        wishlist/
      (admin)/admin/            # admin application under /admin
      api/v1/                   # Route Handlers
      robots.ts
      sitemap.ts
    components/                 # shared UI (shadcn)
    features/                   # feature modules (catalog, cart, checkout, admin)
    lib/                        # supabase clients, env, logger, money
    db/                         # drizzle schema, relations, migrations
    server/                     # domain services (inventory, cart merge, payments)
    types/
    hooks/
    utils/
    middleware.ts               # session refresh + route protection (not sole authz)
  drizzle/
  tests/
  docs/                         # later: ARCHITECTURE.md, DATABASE.md, API.md, ...
  .env.example
```

### Trust boundaries

```
Browser
  → public Supabase client (anon key only)
  → Next.js Route Handlers / Server Actions / RSC

Next.js server
  → user-scoped Supabase SSR client (RLS)
  → privileged server client (SERVICE_ROLE_KEY) only in tightly scoped server modules
  → PostgreSQL via Drizzle (migrations) and/or RPC for atomic inventory
```

**Hard rules:**

- No queries in UI components.
- No `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- Admin APIs authorize from server session + DB role, not UI flags.
- Money as `numeric`/`decimal`, never float.
- Inventory: atomic reserve / sale / release; never `reserved > on_hand`.
- Payments: `PaymentGateway` interface; Razorpay is one implementation; webhooks are source of truth and idempotent.

### Data ownership (logical; schema not implemented in Phase 0)

Auth/users: `profiles` + server-side roles.  
Catalog: `products`, `product_variants`, `product_images`, `categories`, `collections`, `drops`, `drop_products`, `product_editions`.  
Inventory: `inventory`, `inventory_transactions`.  
Commerce: `carts`, `cart_items`, `wishlists`, `wishlist_items`, `orders`, `order_items`, `order_status_history`, `payments`, `coupons`, `coupon_usages`, `reviews`.  
Ops: `audit_logs`.  
Addresses: `addresses` plus **order snapshots**.

### Auth / roles

| Role | Scope (target) |
| --- | --- |
| `user` | Own profile, addresses, carts, orders, wishlist; verified-purchase reviews |
| `staff` | Orders, inventory read, customer support |
| `manager` | Products, inventory, orders, customers, analytics |
| `admin` | Full access including users, coupons, settings, audit logs |

### Payments

```
Checkout → reserve inventory (atomic)
        → PaymentService.createOrder(gateway)
        → client checkout UX (untrusted)
        → webhook: verify signature, amount, currency, idempotency
                 → mark payment/order
                 → convert reservation to sale
```

Failure / cancel → release reservation.  
Return → `return` inventory transaction.

---

## 11. Migration plan

This is a **build plan**, not a data migration. There is no production database.

| Phase | Name | Status after this audit | Next action |
| --- | --- | --- | --- |
| **0** | Repository audit | **Complete** | Stop. Await further instructions. |
| 1 | Architecture | Not started | Scaffold Next.js + TypeScript + Tailwind + shadcn; lock folder layout; add docs stubs and `.env.example`. **Do not** implement business schema yet unless instructed. |
| 2 | Supabase project configuration | Not started | SSR clients (anon vs server), env validation, storage bucket names, local/mock fallback if no live project. |
| 3 | Database schema | Not started | Drizzle models matching the brief; UUID PKs; UTC timestamps; numeric money; indexes. |
| 4 | RLS policies | Not started | Enable RLS on customer-facing tables; no `USING (true)` on sensitive data; admin via server role checks. |
| 5 | Authentication | Not started | Email/password, verify, reset, middleware; protect `/account`, `/orders`, `/checkout`, `/admin`; design for Google/Apple later. |
| 6 | Catalog / product APIs | Not started | `/api/v1/products` with server-side pagination/filters; collections/drops. |
| 7 | Inventory | Not started | Atomic reserve/release/sale RPC; never negative available. |
| 8 | Cart / wishlist | Not started | Guest + auth carts; safe merge on login. |
| 9 | Orders | Not started | Snapshots, status history, server-only creation. |
| 10 | Payments | Not started | Gateway interface + Razorpay; idempotent webhook. |
| 11 | Customer UI | Not started | Premium storefront pages per brief. |
| 12 | Admin UI | Not started | `/admin/*` with server authz; dashboard metrics. |
| 13 | Testing | Not started | Authz, cart, inventory, checkout, payments; integration tests for inventory/payments. |
| 14 | Security hardening | Not started | Secret scan, RLS review, webhook verification, logging redaction. |
| 15 | Production deployment | Not started | Vercel, env split (dev/staging/prod), non-destructive migrations. |

### Phase 0 stop condition

- No application code added beyond this audit document.
- No database implementation.
- No duplicate clients or schemas (none exist).
- No rewrite of working code (none exists).

---

## Decision log (Phase 0)

| Decision | Choice | Why |
| --- | --- | --- |
| Treat repo as greenfield | Yes | Empty tree; only init commit. |
| Preserve existing code | N/A | Nothing to preserve. |
| App topology | Single Next.js app + `/admin` route group | Fits empty repo; admin still isolated by layout + server authz. Revisit monorepo if needed. |
| Implement DB now | **No** | Phase 0 forbids it. |
| Next phase | Wait for instructions | Per critical rule. |

---

*End of Phase 0. Do not proceed to Phase 1 until instructed.*
