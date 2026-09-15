# MELKORAA

Premium contemporary streetwear. **BUILD YOUR OWN IDENTITY.**

This repository is a Next.js App Router storefront with an `/admin` surface. Phase 1 is foundation only: routing, layouts, design system, Supabase clients, and Drizzle configuration. Catalog, inventory, orders, payments, and full authentication are not implemented yet.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage) — clients only in this phase
- Drizzle ORM (configured, schema deferred)
- Zod, React Hook Form, Zustand, Framer Motion

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev -- --port 4317
```

Fill `.env.local` with a Supabase project when you have one. The storefront and admin UI render without credentials. Protected routes (`/account`, `/checkout`, `/admin`) redirect to `/login` only after public Supabase env vars are set.

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. Never commit `.env` or `.env.local`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Drizzle migrations (Phase 3+) |

## Layout

- Customer: `src/app/(store)`
- Auth: `src/app/(auth)`
- Admin: `src/app/admin`
- API stubs: `src/app/api/v1`

Server-only database and service-role access live under `src/db`, `src/server`, and `src/lib/supabase/admin.ts`.
