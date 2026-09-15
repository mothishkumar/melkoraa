# MELKORAA

Premium contemporary streetwear. **BUILD YOUR OWN IDENTITY.**

This repository is a Next.js App Router storefront with an `/admin` surface. Phase 2 added the PostgreSQL / Drizzle foundation. Phase 3 adds Supabase Auth. Phase 4 adds the product catalog HTTP API. Phase 5 adds variant inventory (on hand / reserved / sold) for staff and checkout-ready reserve/release/confirm services. Phase 6 adds authenticated cart and wishlist APIs. Checkout and payments are not implemented yet.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- Drizzle ORM + SQL migrations
- Zod, React Hook Form, Zustand, Framer Motion

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL (transaction pooler) and DIRECT_DATABASE_URL (direct) in .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Protected routes (`/account`, `/checkout`, `/admin`) redirect to `/login` after public Supabase env vars are set. Customers cannot open `/admin`. See [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md), [docs/CATALOG_API.md](./docs/CATALOG_API.md), [docs/INVENTORY_API.md](./docs/INVENTORY_API.md), and [docs/CART_WISHLIST_API.md](./docs/CART_WISHLIST_API.md).

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. Never commit `.env` or `.env.local`.

See [DATABASE.md](./DATABASE.md) for schema, RLS, and seed details.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (port 4317) |
| `npm run lint` | ESLint |
| `npm run test` | Auth helper unit tests |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply reviewed migrations |
| `npm run db:seed` | Idempotent DROP 001 catalog seed |
| `npm run db:studio` | Drizzle Studio |

## Layout

- Customer: `src/app/(store)`
- Auth: `src/app/(auth)`
- Admin: `src/app/admin`
- API stubs: `src/app/api/v1`

Server-only database and service-role access live under `src/db`, `src/server`, and `src/lib/supabase/admin.ts`.
