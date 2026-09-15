# MELKORAA inventory API

Phase 5 stock management. Inventory is owned by **product variants**, not products. The public catalog still exposes only boolean `available` (Phase 4). Exact `on_hand` / `reserved` / `sold` never leave admin APIs.

## Model

| DB column | API field |
| --- | --- |
| `quantity_on_hand` | `onHand` |
| `quantity_reserved` | `reserved` |
| `quantity_sold` | `sold` |

**Available** = `onHand - reserved` (derived, never stored).

Constraints (PostgreSQL checks + unique index):

- all quantities `>= 0`
- `reserved <= on_hand`
- one inventory row per `variant_id`

`reorder_level` is admin-only metadata. Cost and supplier data do not exist and are not added.

## Operations

All mutations are **one atomic `UPDATE … WHERE`**. Services check `returning` row count; zero rows means the predicate failed. Ledger insert and state update run in the **same Drizzle transaction**.

| Op | Effect | Predicate |
| --- | --- | --- |
| Adjust | `on_hand += delta` | next on_hand `>= 0` and `>= reserved` |
| Reserve | `reserved += qty` | `on_hand - reserved >= qty` |
| Release | `reserved -= qty` | `reserved >= qty` |
| Confirm sale | `reserved -= qty`, `sold += qty` | `reserved >= qty` |
| Initialize | insert row | unique `variant_id` |

Confirm sale **does not change on_hand**. Physical stock was already committed when it was received (`purchase` / `adjustment`). Sale consumes the reservation.

These same `reserveInventory` / `releaseInventory` / `confirmInventorySale` functions are what cart and checkout must call later. Do not duplicate SQL in those phases.

## Ledger

`inventory_transactions` is append-only (`purchase`, `reservation`, `release`, `sale`, `adjustment`, `return`). Updates and deletes are revoked for `anon`/`authenticated`. Quantity is nonzero. Adjustment deltas are signed; other ops store a positive quantity with the type discriminating direction.

### Idempotency

There is **no unique constraint** on `(reference_type, reference_id)`. Retried checkout calls with the same cart line id would double-apply. Phase 5 does not add columns or indexes. Checkout should introduce a unique ledger reference (or an outbox) before going live.

## Authorization

Matches Phase 2 RLS and Phase 3/4 API policy:

| | Role |
| --- | --- |
| GET list/detail | staff, manager, admin |
| POST initialize / adjust / reserve / release / confirm | manager, admin |
| Customer | 403 |
| Unauthenticated | 401 |

## Concurrency

Reservations use `UPDATE inventory SET reserved = reserved + $qty WHERE on_hand - reserved >= $qty`. PostgreSQL row locks serialize concurrent updates; the loser sees zero rows → `INSUFFICIENT_STOCK`. Do not `SELECT` then `UPDATE`.

## Endpoints

### `GET /api/v1/admin/inventory`

Query: `page`, `pageSize` (max 100), `search` (SKU / product name / slug), `productId`, `sku`, `availability=in_stock|out_of_stock|low_stock`, `sort` allow-list (`updated_desc` default, `updated_asc`, `on_hand_*`, `available_*`, `sku_*`, `reserved_desc`).

Response: `{ data: InventoryListItem[], pagination }`.

### `GET /api/v1/admin/inventory/:variantId`

Includes `recentTransactions`.

### `POST /api/v1/admin/inventory`

Initialize:

```json
{ "variantId": "…", "onHand": 10, "reorderLevel": 2, "notes": "opening" }
```

`201`. Duplicate → `409 INVENTORY_CONFLICT`. `onHand: 0` creates the row with no ledger line (ledger forbids quantity `0`).

### Mutations (`manager+`)

Bodies are `.strict()`. Only `delta`/`quantity`, optional `notes`, `referenceType`, `referenceId`.

- `POST /api/v1/admin/inventory/:variantId/adjust` `{ "delta": -2 }`
- `POST /api/v1/admin/inventory/:variantId/reserve` `{ "quantity": 1 }`
- `POST /api/v1/admin/inventory/:variantId/release` `{ "quantity": 1 }`
- `POST /api/v1/admin/inventory/:variantId/confirm` `{ "quantity": 1 }`

## Errors

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Zod (qty `0`, decimals, NaN, extra fields) |
| `UNAUTHENTICATED` | 401 | no session |
| `FORBIDDEN` | 403 | customer / staff mutating |
| `VARIANT_NOT_FOUND` / `INVENTORY_NOT_FOUND` | 404 | missing |
| `INSUFFICIENT_STOCK` | 409 | reserve predicate failed |
| `INVENTORY_CONFLICT` | 409 / 422 | duplicate init; adjust/release/confirm predicate failed |
| `INTERNAL` | 500 | unexpected |

## Future checkout

1. Add to bag → `reserveInventory(variantId, qty, { referenceType: "cart_item", referenceId })`
2. Remove / expire cart → `releaseInventory`
3. Paid order → `confirmInventorySale`
4. Add a unique ledger reference before relying on retries
