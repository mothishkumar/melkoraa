# MELKORAA authentication

Production authentication uses **Supabase Auth** with the Next.js App Router. Roles and customer profiles live in PostgreSQL (`public.profiles`) from Phase 2. This document covers Phase 3 only.

## Architecture

- Browser client: `src/lib/supabase/browser.ts` (anon key only)
- Server client: `src/lib/supabase/server.ts` (anon key + cookies)
- Service role: `src/lib/supabase/admin.ts` (`server-only`, never imported from Client Components)
- Session refresh: `src/proxy.ts` (Next.js 16 proxy)
- Server helpers: `src/lib/auth/`
- Server actions: `src/features/auth/actions.ts`

Authorization is always performed on the server from the Supabase session and the `profiles.role` column. Do not trust `localStorage`, client Zustand, cookies you create, query strings, or request bodies for roles.

The Phase 2 trigger `handle_new_user` inserts a `customer` profile (and an empty wishlist) after `auth.users` insert. **Do not add another signup trigger.** Do not insert profiles from the browser.

## Registration

1. Client validates with Zod (`fullName`, `email`, `password`, `confirmPassword`).
2. Server action calls `supabase.auth.signUp()` with `user_metadata` names.
3. Supabase creates `auth.users`.
4. Existing database trigger creates `profiles` (`role = customer`).
5. If email confirmation is enabled, the user is sent to `/verify-email`.
6. If a session is returned (confirmation disabled), they are redirected to `/account` (or `/admin` for staff roles).

## Login

`signInWithPassword`. Invalid credentials always map to: **Email or password is incorrect.** Unverified emails receive a confirmation reminder. After success, cookies are refreshed via the server client.

Redirects:

- Customer → `/account` (or a safe `next` path)
- Staff / manager / admin → `/admin`
- Customer requesting `/admin` as `next` → `/unauthorized`

`next` must be an internal relative path. Absolute and protocol-relative URLs are ignored.

## Logout

`logoutAction` and `POST /api/v1/auth/logout` call `supabase.auth.signOut()` on the server, revalidate the layout, and send the user home. Do not treat client-only sign-out as sufficient.

## Email verification

`/verify-email` explains the inbox check and can resend a Supabase signup email. Resend uses a 60-second httpOnly cooldown cookie. Success copy does not confirm whether the address exists.

Redirect URL: `{NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account`

## Password recovery

1. `/forgot-password` → `resetPasswordForEmail` with redirect `{site}/auth/callback?next=/reset-password`
2. Always show: **If an account exists for that email, you'll receive a password reset link.**
3. `/auth/callback` exchanges the PKCE `code` for a session.
4. `/reset-password` requires a recovery/session. Hash-based recovery is still accepted on the client.
5. `updateUser({ password })` then server sign-out and redirect to `/login`.

## Session handling

`getUser()` is used (not `getSession()` alone) on the server and in the proxy. The proxy refreshes auth cookies. Server Components that cannot write cookies rely on that refresh.

## Roles

`UserRole`: `customer` | `staff` | `manager` | `admin`

| Role | Access |
| --- | --- |
| customer | Account routes |
| staff | Customer + `/admin` and staff APIs |
| manager | Staff + manager helpers |
| admin | Full administrative helpers |

Helpers: `requireAuth`, `requireStaff`, `requireManager`, `requireAdmin` (pages) and `requireApiAuth` / `requireApiStaff` / `requireApiManager` / `requireApiAdmin` (APIs).

Phase 3 does **not** implement catalog, cart, checkout, or order business logic. It only gates the surfaces.

## Protected routes

| Path | Rule |
| --- | --- |
| `/account/*` | Authenticated |
| `/checkout` | Authenticated (proxy) |
| `/admin/*` | Staff / manager / admin |
| `/unauthorized` | Public explanation page |

Unauthenticated visits to protected pages go to `/login?next=…` with a safe path.

## API authorization

| Endpoint | Auth |
| --- | --- |
| `GET /api/v1/health` | Public |
| Catalog stubs | Public (still 501) |
| `GET /api/v1/auth/me` | 401 if anonymous |
| `POST /api/v1/auth/logout` | 401 if anonymous |
| `/api/v1/orders*` | Authenticated |
| `POST /api/v1/payments/create-order` | Authenticated |
| `/api/v1/admin/*` | Staff+ (401 / 403) |
| Payments webhook | Public (signature in a later phase) |

Status codes: 401 unauthenticated, 403 authenticated without permission, 400 invalid input, 429 rate limited, 500 unexpected. No stack traces or secrets.

## Profile handling

`getCurrentProfile()` reads `profiles` for `auth.users.id` using the user-scoped server client (RLS). If a user exists without a profile, a **server-only** repair insert runs with the service role (`role = customer`, `ON CONFLICT` equivalent via duplicate handling). Names from `user_metadata` are synced when `first_name` is empty. Clients never insert profiles.

## Security rules

- Never put `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*`.
- Never log passwords, access tokens, refresh tokens, or service-role keys (`src/lib/logger.ts` redacts known secret keys).
- Do not store tokens in `localStorage`.
- Map Auth errors to safe copy; do not return Postgres or Supabase internals.
- Forgot-password and verification resend avoid email enumeration.
- Open redirects are rejected in `getSafeRedirectPath`.

## Environment

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `DATABASE_URL`
- `DIRECT_DATABASE_URL` (migrations)
- `NEXT_PUBLIC_SITE_URL` (email redirect base)

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

In the Supabase dashboard, set the Auth Site URL and redirect allow-list to include `{NEXT_PUBLIC_SITE_URL}/auth/callback` and password recovery paths.

## Local development

```bash
cp .env.example .env.local
# fill real project values
npm run dev
```

Then exercise `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/account`, `/admin`, and `/unauthorized`. Assign staff roles in the database (`profiles.role`) — never from the client.
