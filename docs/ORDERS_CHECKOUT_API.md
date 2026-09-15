# MELKORAA orders and checkout

Phase 7 server-authoritative checkout. Razorpay and `confirmInventorySale` are **Phase 8**. Add-to-cart still does not reserve stock; checkout does.

## Flow

1. `requireApiAuth()` — never trust client `userId` / `cartId` / prices.
2. `POST /api/v1/checkout` `{ addressId, idempotencyKey, billingAddressId? }` (strict Zod).
3. Load the session user's **active** cart. Empty → `422 EMPTY_CART`.
4. Re-read catalog prices and availability (Phase 4 money, integer minor units). Snapshots on `order_items` use live variant price, **not** `cart_items.unit_price`.
5. Product must be `active`, variant `is_active`, qty covered by `on_hand - reserved`. Else `422 CHECKOUT_UNAVAILABLE` or `409 INSUFFICIENT_STOCK`.
6. Verify `addressId` belongs to the session user. Copy JSONB shipping/billing snapshots so later address edits do not rewrite history.
7. **One database transaction:** insert `orders` (`status=pending`, `payment_status=pending`) → insert `order_items` → `reserveInventory` per line (Phase 5, same tx) → `order_status_history` → pending `payments` row (`provider=checkout`) → convert/clear cart.
8. Return the order summary. Never mark paid. Never call `confirmInventorySale`.

Customer-facing `order_number` is `MK-{UTC year}-{8 hex}` from `crypto.randomBytes`, unique, separate from the internal UUID.

## Transaction strategy

Phase 5 `reserveInventory` / `releaseInventory` each used to open their own transaction. Checkout **must not** nest a second top-level transaction (runtime Postgres client `max: 1`).

Services now accept an optional Drizzle `tx`. Checkout/cancel pass the outer transaction; admin inventory APIs still use a per-call transaction. Reserve + ledger + order rows commit or roll back together. If any reserve fails, the order insert is rolled back and the **cart is preserved**.

## Inventory

| Event | Service | Ledger `reference_type` | `reference_id` |
| --- | --- | --- | --- |
| Checkout | `reserveInventory` | `order_item` | order item UUID |
| Unpaid cancel | `releaseInventory` | `order_item_release` | order item UUID |
| Paid (Phase 8) | `confirmInventorySale` | not in this phase | — |

Unique index `inventory_transactions_reference_uidx` on `(reference_type, reference_id)` where both are set. Retries cannot double-apply the same reserve line.

Concurrent identical idempotency keys are serialized by PostgreSQL unique indexes when they use **separate connections**. This process uses a single pooled client (`max: 1`); overlapping checkouts in the same Node isolate should be avoided. HTTP retries after a completed checkout are safe and return the original order.

## Idempotency

`orders.idempotency_key` plus unique `(user_id, idempotency_key)` (nulls excluded). The client must send a UUID key. A replay returns the existing order. Concurrent checkouts with the same key serialize on that unique index: one insert wins.

## Lifecycle

Schema has no `PENDING_PAYMENT` enum. Checkout uses **`orders.status = pending`** and **`payment_status = pending`** (unfulfilled). Phase 8 marks paid / confirmed and confirms sale.

Cancel (`POST /api/v1/orders/:orderId/cancel`): owner only, only if `pending` + `payment pending`. Releases reservations, sets `cancelled`, payment `failed`. No refunds.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/v1/checkout` | customer session |
| GET | `/api/v1/orders` | owner, paginated newest first |
| GET | `/api/v1/orders/:orderId` | owner |
| POST | `/api/v1/orders/:orderId/cancel` | owner |
| GET | `/api/v1/admin/orders` | staff+ |
| GET | `/api/v1/admin/orders/:id` | staff+ |

## Errors

`VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `ADDRESS_NOT_FOUND` / `ORDER_NOT_FOUND` 404 · `INSUFFICIENT_STOCK` / `ORDER_NOT_CANCELLABLE` 409 · `EMPTY_CART` / `CHECKOUT_UNAVAILABLE` 422 · `INTERNAL` 500. No raw Postgres.

## Security

Mass assignment rejected. DTOs have no `onHand` / `reserved` / `sold`. Staff list/detail is read-only. Drizzle uses `DATABASE_URL` (RLS bypass); every query is still scoped by session user id.

## Phase 8 hooks

1. Create Razorpay order for `payments.provider_order_id`.
2. On webhook paid: set payment `paid`, order `confirmed`, `confirmInventorySale` per item with a **new** ledger reference (not the reserve pair).
3. On fail/expire: `releaseInventory` (same as cancel) if still unpaid.
4. Do not confirm sale at checkout.
