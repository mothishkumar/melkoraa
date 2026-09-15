# Admin dashboard

Internal operations UI for MELKORAA. It reuses Phase 3–8 APIs, services, repositories, Zod contracts, and role guards. The storefront is unchanged except for shared primitives.

Navigation hiding is **not** authorization. Route handlers and `requireStaff` / `requireManager` / `requireApiStaff` / `requireApiManager` remain authoritative.

## Routes

| Path | Who can open | Data |
| --- | --- | --- |
| `/admin` | staff, manager, admin | Dashboard snapshot |
| `/admin/products` | staff+ | Product list |
| `/admin/products/new` | manager, admin | Create form (`requireManager`) |
| `/admin/products/[id]` | staff+ | Product, variants, images, drop association |
| `/admin/inventory` | staff+ | Inventory list, ledger, manager adjust |
| `/admin/orders` | staff+ | Order list |
| `/admin/orders/[id]` | staff+ | Order detail |
| `/admin/customers` | staff+ | Customer profiles |
| `/admin/drops` | staff+ | Drops |
| `/admin/drops/[id]` | staff+ | Drop + product associations |
| `/admin/collections` | staff+ | Collections |
| `/admin/audit-logs` | manager, admin | Read-only `audit_logs` |

Customers hitting `/admin` are redirected to `/unauthorized` (proxy + `requireStaff`). Unauthenticated users go to `/login`.

Leftover paths (`/admin/categories`, `/coupons`, `/reviews`, `/analytics`, `/users`, `/settings`) are out of Phase 10 navigation.

## Roles

| Role | Dashboard | Reads | Catalog/inventory/drop/collection mutations | Audit log read |
| --- | --- | --- | --- | --- |
| customer | no | no | no | no |
| staff | yes | yes | no (API 403) | no (page + API 403) |
| manager | yes | yes | yes | yes |
| admin | yes | yes | yes | yes |

Staff mutation buttons are hidden. Direct API calls still require manager/admin.

There is **no** role-assignment API. Staff cannot change customer roles.

## API dependencies

Typed client: `src/lib/api/admin.ts`.

- `GET /api/v1/admin/dashboard`
- `GET/POST /api/v1/admin/products`, `GET/PATCH/DELETE /api/v1/admin/products/:id`
- variants and images under `/api/v1/admin/products/:id/...`
- `GET /api/v1/admin/inventory`, `GET /api/v1/admin/inventory/:variantId`
- `POST /api/v1/admin/inventory/:variantId/adjust` (manager)
- `GET /api/v1/admin/orders`, `GET /api/v1/admin/orders/:id`
- `GET /api/v1/admin/customers`
- `GET/POST /api/v1/admin/drops`, `GET/PATCH/DELETE /api/v1/admin/drops/:id`
- `POST /api/v1/admin/drops/:id/products`, `DELETE .../products/:productId`
- `GET/POST /api/v1/admin/collections`, `PATCH/DELETE /api/v1/admin/collections/:id`
- `GET /api/v1/admin/categories` (product form)
- `GET /api/v1/admin/audit-logs` (manager)

## Product management

List: search, status, sort, pagination via `adminProductQuerySchema`. Display name, slug, price, status, categories, created date, variant count, thumbnail.

Create/edit: `createProductSchema` / `updateProductSchema` (`.strict()`). Clients cannot set `createdAt`, `updatedAt`, inventory, roles, or ids.

Archive: `DELETE` sets `status = archived`. Confirmation required.

Variants and images use existing admin APIs. Public catalog still exposes `available` only, not on-hand counts.

Drop association uses `drop_products`. Collections have **no** product join table.

## Inventory management

List uses Phase 5 filters (search, availability, sort, pagination). Managers adjust through `adjust` with confirmation. Ledger is the variant detail from `GET /api/v1/admin/inventory/:variantId`.

Reserve / release / confirm stay order/payment flows. The UI does not call them as ad-hoc stock tools.

The UI does not compute authoritative stock. The API rejects illegal negative/on-hand &lt; reserved adjustments.

## Order management

Admin list/detail APIs. Filters: order number search, status, payment status. Detail shows items, totals, shipping snapshot, payment **provider/status/amount** only (no Razorpay secrets, cards, or webhook data).

No admin refund, capture, shipment, or cancel UI — those APIs are not implemented for staff. Customer unpaid cancel remains the existing customer endpoint.

## Customer management

`GET /api/v1/admin/customers` reads `profiles` with `role = customer`, optional name/phone search, order counts, and email via server-side `auth.admin.getUserById`. No passwords, tokens, or `auth.users` dumps.

## Drops and collections

Drops including seeded **DROP 001 / THE BUILDER** come from the database. Create/edit/archive and product association use existing drop APIs.

Collections: list/create/edit/archive. Product membership is not stored on collections; public `?collection=` still means products in an active drop.

## Audit logs

`audit_logs` exists with RLS. `GET /api/v1/admin/audit-logs` is a manager-only read of that table. Metadata keys that look like secrets are stripped.

Catalog, inventory, and order services currently write to the application logger, **not** `audit_logs`. The UI shows an empty state when the table is empty. This is not a fake frontend audit trail.

## Security

- No `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secrets, or database URLs in client modules.
- Service-role client is server-only (`src/lib/supabase/admin.ts`) for customer email lookup.
- Zod `.strict()` on writes.
- User ids in customer/order tables are identifiers, not impersonation inputs.

## Known limitations

- PostgreSQL client uses `max: 1` connection; catalog/admin can stall when that connection is busy.
- Guest cart, coupons, tax, shipping, Razorpay refunds, and Journal remain unimplemented.
- No admin order cancel/refund/fulfillment.
- No collection↔product join.
- Audit writers are not wired.
- Customer email lookup is per-user on the current page (capped by `pageSize`).
- Inventory reserve/release/confirm are not exposed as dashboard actions.
