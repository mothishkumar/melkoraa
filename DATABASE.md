# MELKORAA database

PostgreSQL on Supabase. Schema is owned by Drizzle. Authentication identities live in `auth.users`; this app never stores passwords or sessions.

Apply to **development** after review. Never auto-apply destructive SQL to production.

## Commands

```bash
# After schema changes
npm run db:generate

# Review src/db/migrations/*.sql (foreign keys, indexes, checks, RLS)
# Then apply to the development database
npm run db:migrate

# Idempotent DROP 001 catalog (development only — do not run in production)
npm run db:seed
```

`DATABASE_URL` must be the Supabase **transaction pooler** URI (server-only, port 6543).  
`DIRECT_DATABASE_URL` must be the **direct** Postgres URI (port 5432) used by `npm run db:migrate`.

## ERD (relationships)

```
auth.users
  └── profiles.user_id (unique, CASCADE)
        ├── addresses.user_id (CASCADE)
        ├── carts.user_id (SET NULL)
        ├── wishlists.user_id (CASCADE unique)
        └── orders.user_id (SET NULL)   # orders are never cascade-deleted

products
  ├── product_variants.product_id (RESTRICT)
  │     ├── inventory.variant_id (unique, RESTRICT)
  │     ├── inventory_transactions.variant_id (RESTRICT)
  │     └── cart_items.variant_id (RESTRICT)
  ├── product_images.product_id (CASCADE)
  ├── product_categories (CASCADE / CASCADE)
  ├── drop_products.product_id (RESTRICT)
  ├── product_editions.product_id (RESTRICT)
  └── reviews.product_id (RESTRICT)

drops ── drop_products ── products
categories ── product_categories ── products

orders
  ├── order_items (RESTRICT)     # snapshots + nullable product/variant FKs SET NULL
  ├── order_status_history (RESTRICT)
  ├── payments (RESTRICT)
  ├── coupon_usages (RESTRICT)
  └── reviews.order_id (RESTRICT)

coupons ── coupon_usages
wishlists ── wishlist_items ── products
carts ── cart_items
```

Historical commerce rows (`orders`, `order_items`, `payments`, `inventory_transactions`, `coupon_usages`, `order_status_history`, `reviews`) use **RESTRICT** or **SET NULL**. They are not cascade-deleted with the customer.

## Tables

| Table | Purpose |
| --- | --- |
| `profiles` | App profile + `app_role`. `user_id` → `auth.users` |
| `addresses` | Customer addresses |
| `categories` | Catalog taxonomy |
| `collections` | Merchandising collections |
| `drops` | Timed / limited drops |
| `drop_products` | Products in a drop (`drop_id + product_id`) |
| `products` | Product master (no stock on this row) |
| `product_variants` | SKU / size / color / price |
| `product_images` | Storage path + public URL, optional variant |
| `product_categories` | M2M products ↔ categories |
| `product_editions` | Limited edition `n / size` (assigned later, not at product create) |
| `inventory` | On hand / reserved / sold per variant |
| `inventory_transactions` | Append-oriented stock ledger |
| `carts` | Guest (`session_id`) or authenticated (`user_id`) |
| `cart_items` | Unique `(cart_id, variant_id)` |
| `wishlists` | One per user |
| `wishlist_items` | Unique `(wishlist_id, product_id)` |
| `orders` | Totals + JSONB address snapshots |
| `order_items` | Line snapshots |
| `order_status_history` | Status audit |
| `payments` | Provider-agnostic (`provider` text, not Razorpay-only) |
| `coupons` | Normalized lowercase unique `code` |
| `coupon_usages` | Unique per order+coupon; unique per user+coupon when `user_id` present |
| `reviews` | Verified-purchase enforcement is later; unique per user+product |
| `audit_logs` | Append-only admin actions |

### Money

All monetary columns are `numeric(12, 2)`. Never float.

### Inventory invariant

Available stock is **derived**: `quantity_on_hand - quantity_reserved`.

Checks:

- all quantities `>= 0`
- `quantity_reserved <= quantity_on_hand`

## Indexes

Created for real lookup paths, not every column:

- Unique slugs: products, categories, collections, drops
- Unique SKU, unique order_number, unique coupon code
- Status filters: products, collections, drops, orders
- FKs used in joins: variant/product/order/cart/user
- `inventory_transactions (variant_id, created_at)`
- `audit_logs (entity_type, entity_id)` and `created_at`
- Partial uniques: one active cart per user/session; payment provider id; edition numbers

## Constraints (PostgreSQL)

Enforced in the database, not only TypeScript:

- prices, discounts, totals `>= 0`
- cart and order quantities `> 0`
- review rating `1..5`
- coupon codes stored lowercase; percentage `0..100`
- inventory reserved cannot exceed on hand
- carts must have `user_id` or `session_id`

## RLS strategy

RLS is **enabled** on all public app tables.

Privileged server work uses the Supabase **service role** (bypasses RLS). The service role key is never `NEXT_PUBLIC_`.

Role is stored on `profiles.role` (`customer` | `staff` | `manager` | `admin`). Browser-supplied roles are ignored.

Helpers (SECURITY DEFINER, `search_path = public`, so they do not recurse through profiles RLS):

| Function | Meaning |
| --- | --- |
| `current_profile_role()` | Role for `auth.uid()` |
| `is_admin()` | `admin` only |
| `is_manager()` | `manager` only |
| `has_staff_access()` | `admin`, `manager`, or `staff` |
| `owns_cart(id)` / `owns_wishlist(id)` / `owns_order(id)` | Owner checks without policy recursion |

### Who can read what

- **Anon / customer:** active products, active variants, images of active products, all categories (public taxonomy), active collections/drops, approved reviews.
- **Customer (authenticated):** own profile (cannot change `role`), own addresses, own carts/items, own wishlist, own orders (select), own coupon usages, own/pending reviews.
- **Staff:** read catalog including drafts, inventory, orders, customers (profiles/addresses), reviews for moderation. Update orders. Cannot manage products/coupons unless manager/admin.
- **Manager:** staff + write catalog, inventory, coupons.
- **Admin:** everything, including user roles and audit log read.

Guest carts are **not** exposed by RLS (no `USING (true)`). Guest cart access is server-side with the service role in a later phase.

Inventory quantities are **not** public; availability will be served by a later API.

`inventory_transactions` and `audit_logs` have no UPDATE/DELETE policies; those privileges are revoked from `anon`/`authenticated`.

Categories use `USING (true)` on SELECT only because they are public reference data with no status column. Customer PII tables never use open policies.

Signup trigger `handle_new_user` inserts `profiles` (role `customer`) and an empty `wishlists` row. `profiles` / `wishlists` are ENABLE RLS but not FORCE RLS so the trigger (table owner) can insert.

## Storage

Buckets (created if `storage.buckets` exists):

| Bucket | Public read | Write |
| --- | --- | --- |
| `product-images` | yes | admin/manager |
| `brand-assets` | yes | admin/manager |
| `avatars` | yes | owner folder `auth.uid()/...` |

Product photos for DROP 001 live in `public/products/` and are linked from seed `product_images` rows.

## Seed strategy

`src/db/seed.ts` upserts on **stable slugs and SKUs**. Running twice does not duplicate catalog rows.

- Categories: t-shirts, hoodies, overshirts, bottoms, accessories
- Collection + drop: DROP 001 — THE BUILDER
- Five products with prices in INR and one description-free product photo each (`public/products/`)
- Apparel sizes S–XXL with stock **15 / 45 / 53 / 30 / 7** (150 per product)
- Cap ONE SIZE = 150
- Initial `inventory_transactions` of type `purchase` with `reference_type = seed` (inserted once per variant)
- Primary `product_images` rows pointing at `/products/*.jpg` (`storage_path` `seed/...`, upserted by path)

Edition numbers are **not** assigned here.

Do not run seed against production.

## Migration files

1. `src/db/migrations/0000_init_melkoraa.sql` — generated by Drizzle (tables, enums, FKs, indexes, checks, ENABLE RLS). Reviewed: no `DROP TABLE`.
2. `src/db/migrations/0001_rls_auth_storage.sql` — custom: auth FKs, triggers, helpers, policies, storage buckets.

## Unresolved / later phases

- Atomic inventory reservation RPCs
- Verified-purchase review rules
- Guest cart cookie merge
- Product/image uploads
- Applying these migrations requires a live Supabase project (`DATABASE_URL`)
