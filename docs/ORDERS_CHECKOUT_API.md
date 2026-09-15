# MELKORAA orders and checkout

Phase 7 server-authoritative checkout plus Phase 8 Razorpay payments. Add-to-cart still does not reserve stock; checkout does. Sale is confirmed only after a verified Razorpay capture.

## Flow

1. `requireApiAuth()` — never trust client `userId` / `cartId` / prices.
2. `POST /api/v1/checkout` `{ addressId, idempotencyKey, billingAddressId? }` (strict Zod).
3. Load the session user's **active** cart. Empty → `422 EMPTY_CART`.
4. Re-read catalog prices and availability (Phase 4 money, integer minor units). Snapshots on `order_items` use live variant price, **not** `cart_items.unit_price`.
5. Product must be `active`, variant `is_active`, qty covered by `on_hand - reserved`. Else `422 CHECKOUT_UNAVAILABLE` or `409 INSUFFICIENT_STOCK`.
6. Verify `addressId` belongs to the session user. Copy JSONB shipping/billing snapshots so later address edits do not rewrite history.
7. **Phase A — one database transaction:** insert `orders` (`status=pending`, `payment_status=pending`) → insert `order_items` → `reserveInventory` per line (Phase 5, same tx) → `order_status_history` → pending `payments` row (`provider=razorpay`) → convert/clear cart. **Commit before any Razorpay HTTP call.**
8. **Phase B:** create a Razorpay order for `moneyToMinor(order.total_amount)` paise, currency `INR`.
9. **Phase C:** store `payments.provider_order_id`. Return `{ order, payment }` with public `keyId` and `razorpayOrderId` only.
10. Never mark paid and never call `confirmInventorySale` in this request.

Customer-facing `order_number` is `MK-{UTC year}-{8 hex}` from `crypto.randomBytes`, unique, separate from the internal UUID.

If Phase B/C fails, the unpaid order is cancelled and reserved stock is released. Use a new idempotency key to retry checkout.

## Transaction strategy

Postgres runtime client uses `max: 1`. External Razorpay HTTP **must not** run inside an open transaction.

Phase 5 `reserveInventory` / `releaseInventory` / `confirmInventorySale` accept an optional Drizzle `tx`. Checkout/cancel/payment finalization pass the outer transaction; admin inventory APIs still use a per-call transaction.

## Inventory

| Event | Service | Ledger `reference_type` | `reference_id` |
| --- | --- | --- | --- |
| Checkout | `reserveInventory` | `order_item` | order item UUID |
| Unpaid cancel / payment failed | `releaseInventory` | `order_item_release` | order item UUID |
| Verified Razorpay capture | `confirmInventorySale` | `order_item_sale` | order item UUID |

Unique index `inventory_transactions_reference_uidx` on `(reference_type, reference_id)` where both are set.

Concurrent identical idempotency keys are serialized by PostgreSQL unique indexes when they use **separate connections**. This process uses a single pooled client (`max: 1`); overlapping checkouts in the same Node isolate should be avoided. HTTP retries after a completed checkout are safe and return the original order **and the same Razorpay order id**.

## Idempotency

`orders.idempotency_key` plus unique `(user_id, idempotency_key)` (nulls excluded). Payment provider events: unique `(provider, provider_event_id)` on `payment_events`. Payment CAS: `pending` → `paid` / `failed`.

## Lifecycle

Schema has no `paid` order status. Capture uses **`orders.status = confirmed`** and **`payment_status = paid`**. Failure / unpaid cancel uses **`cancelled`** and **`payment_status = failed`**.

Cancel (`POST /api/v1/orders/:orderId/cancel`): owner only, only if `pending` + `payment pending`. Releases reservations, sets `cancelled`, payment `failed`. Paid orders return `409` — no automatic refunds.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/v1/checkout` | customer session |
| POST | `/api/v1/payments/verify` | customer session |
| POST | `/api/v1/webhooks/razorpay` | Razorpay signature |
| GET | `/api/v1/orders` | owner, paginated newest first |
| GET | `/api/v1/orders/:orderId` | owner |
| POST | `/api/v1/orders/:orderId/cancel` | owner |
| GET | `/api/v1/admin/orders` | staff+ |
| GET | `/api/v1/admin/orders/:id` | staff+ |

Payment initiation is **only** checkout. `POST /api/v1/payments/create-order` returns `409 USE_CHECKOUT`.

## Errors

`VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `ADDRESS_NOT_FOUND` / `ORDER_NOT_FOUND` / `PAYMENT_NOT_FOUND` 404 · `INSUFFICIENT_STOCK` / `ORDER_NOT_CANCELLABLE` / `PAYMENT_MISMATCH` 409 · `EMPTY_CART` / `CHECKOUT_UNAVAILABLE` 422 · `PAYMENT_UNAVAILABLE` / `PAYMENT_PROVIDER_FAILED` 503 · `INTERNAL` 500. No raw Postgres. No secrets in bodies.

## Security

Mass assignment rejected. DTOs have no `onHand` / `reserved` / `sold`. Staff list/detail is read-only. Drizzle uses `DATABASE_URL` (RLS bypass); every customer query is still scoped by session user id. Razorpay secrets never leave the server.

## Phase 8

See `docs/RAZORPAY_PAYMENTS.md` for webhook events, dashboard setup, and the Phase 9 Checkout contract.
