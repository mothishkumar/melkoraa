# MELKORAA

Premium contemporary streetwear. **BUILD YOUR OWN IDENTITY.**

This repository is a Next.js App Router storefront with an `/admin` surface. Phase 2 adds the PostgreSQL / Drizzle foundation (schema, RLS, seed). Catalog APIs, checkout, and live authentication are not implemented yet.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- Drizzle ORM + SQL migrations
- Zod, React Hook Form, Zustand, Framer Motion

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL and Supabase keys
npm run db:migrate
npm run db:seed
npm run dev
```

Fill `.env.local` with a Supabase project. The storefront UI still renders without credentials. Protected routes (`/account`, `/checkout`, `/admin`) redirect to `/login` only after public Supabase env vars are set.

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. Never commit `.env` or `.env.local`.

See [DATABASE.md](./DATABASE.md) for schema, RLS, and seed details.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (port 4317) |
| `npm run lint` | ESLint |
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
