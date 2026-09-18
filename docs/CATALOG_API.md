# MELKORAA catalog API

Phase 4 catalog domain. Queries go through Route Handlers → Zod → services → repositories → Drizzle → PostgreSQL. React components do not query the catalog database.

There is **no** `product_type` or `is_new` column. Public `productType` filters map onto **category slugs**. `isNew` is derived from `created_at` (last 30 days). Collections have no product join table; `?collection=` requires an active collection and then limits results to products in an **active drop**.

Product **DELETE** archives (`status = archived`). Variants are deactivated (`is_active = false`). Categories without assigned products may be deleted by admins. Collections and drops are archived.

## Public

All public list endpoints return `{ data, pagination }` with `page`, `pageSize`, `total`, `totalPages`. Default `page=1`, `pageSize=20`, max `pageSize=100`.

### `GET /api/v1/products`

Query:

| Param | Notes |
| --- | --- |
| `page`, `pageSize` | integers |
| `search` | name, slug, short description, description (parameterized `ILIKE`) |
| `category` | category slug |
| `productType` | alias for category (`T_SHIRT` → `t-shirts`) |
| `collection` | active collection slug (see limitation above) |
| `drop` | drop slug (`drop-001`) |
| `isNew` | `true` / `false` |
| `sort` | `newest` `oldest` `price_asc` `price_desc` `name_asc` `name_desc` |
| `minPrice`, `maxPrice` | numeric, compared to `products.base_price` |

Only `products.status = active`. List items include primary image, categories, `available` boolean (not quantities), and prices as decimal strings.

Invalid query → `400` `{ error: { code, message, details? } }`.

### `GET /api/v1/products/:slug`

`{ data: ProductDetail }` with images (sort order), active variants (`available` boolean), categories, primary public drop, and public edition summary when `product_editions` rows exist.

Missing or non-active → `404` `PRODUCT_NOT_FOUND`.

Seeded example: `/api/v1/products/essential-oversized-tee`.

### `GET /api/v1/categories`

All categories (no status column). Paginated.

### `GET /api/v1/collections`

`status = active` only.

### `GET /api/v1/drops`

`status = active` only.

### `GET /api/v1/drops/:slug`

Drop plus associated **active** products in `display_order`. Seeded: `/api/v1/drops/drop-001`.

## Admin authorization

Uses Phase 3 helpers. Customers cannot call these endpoints.

| Action | Role |
| --- | --- |
| GET list/detail | staff, manager, admin |
| POST / PATCH / archive | manager, admin |
| DELETE unused category | admin |

Unauthenticated → `401`. Authenticated customer → `403`.

## Admin products

- `GET /api/v1/admin/products` — includes drafts/archived; `status`, `search`, `sort`, pagination
- `GET /api/v1/admin/products/:id`
- `POST /api/v1/admin/products` — `{ name, slug, basePrice, ... }` `201`
- `PATCH /api/v1/admin/products/:id` — partial, `.strict()` (no `id` / timestamps)
- `DELETE /api/v1/admin/products/:id` — archive

Duplicate slug/SKU → `409 CONFLICT`.

### Variants

- `POST /api/v1/admin/products/:id/variants`
- `PATCH /api/v1/admin/products/:id/variants/:variantId`
- `DELETE .../:variantId` — sets `is_active = false`

Creating a variant also inserts an inventory row at **zero** on-hand (no reservation logic). Ownership: variant must belong to `:id`.

### Images

Bucket `product-images` (public read). Multipart field `file` plus optional `altText`, `sortOrder`, `imageType`, `variantId`.

- `POST /api/v1/admin/products/:id/images`
- `PATCH /api/v1/admin/products/:id/images/:imageId`
- `DELETE .../:imageId` → `204`

JPEG/PNG/WebP, max 5MB. Image must belong to the product. Upload uses the authenticated server Supabase client (manager/admin storage policies).

## Admin categories / collections / drops

- Categories: `GET/POST /api/v1/admin/categories`, `PATCH/DELETE /api/v1/admin/categories/:id`
- Collections: `GET/POST /api/v1/admin/collections`, `PATCH/DELETE /api/v1/admin/collections/:id` (DELETE archives)
- Drops: `GET/POST /api/v1/admin/drops`, `GET/PATCH/DELETE /api/v1/admin/drops/:id` (DELETE archives)
- `POST /api/v1/admin/drops/:id/products` `{ productId, displayOrder? }`
- `DELETE /api/v1/admin/drops/:id/products/:productId`

## Errors

```json
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found" } }
```

| Status | When |
| --- | --- |
| 400 | validation |
| 401 | no session |
| 403 | wrong role |
| 404 | missing / not public |
| 409 | unique slug/SKU |
| 500 | unexpected (generic message) |

Money is `numeric(12,2)` returned as strings (`"1499.00"`). No cost, supplier, inventory counts, or audit internals on public payloads.
