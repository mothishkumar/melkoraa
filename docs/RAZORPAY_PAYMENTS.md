# MELKORAA Razorpay payments (Phase 8)

Server-authoritative Razorpay Checkout for unpaid orders created in Phase 7. No storefront UI. No coupons, tax, or shipping. Refunds are out of scope.

## 1. Architecture

```
POST /api/v1/checkout
  → DB transaction (Phase A): order + items + reserveInventory + pending payment
  → COMMIT
  → Razorpay Orders API (Phase B) — never inside the Postgres transaction
  → attach provider_order_id (Phase C)
  → return public key id + Razorpay order id

Razorpay Checkout (Phase 9 UI)
  → customer pays
  → POST /api/v1/webhooks/razorpay  (authoritative)
  and/or
  → POST /api/v1/payments/verify    (authenticated callback; same finalizer)
```

Provider wrapper: `src/server/payments/razorpay` (official `razorpay` SDK, server-only). Shared finalization: `src/server/services/payments/payment-service.ts`. SQL stays in `src/server/repositories/payments`.

## 2. Checkout → Razorpay

Amount is `moneyToMinor(order.total_amount)` in paise. Currency is `INR`. The client cannot send totals. Receipt is the MELKORAA `order_number`.

If Razorpay creation fails after Phase A, the unpaid order is cancelled and reserved stock is released (`failUnpaidOrder`). The checkout idempotency key is then consumed; the client must start a new checkout.

Replay of the same idempotency key after a successful attach does **not** create a second Razorpay order.

## 3. Razorpay order creation

`PaymentProvider.createOrder({ amountPaise, currency: "INR", receipt, notes.melkoraaOrderId })`.

The returned Razorpay amount/currency must match the internal payment. Unique index `(provider, provider_order_id)` prevents two MELKORAA payments from sharing one Razorpay order.

## 4. Payment verification (frontend callback)

`POST /api/v1/payments/verify` requires a customer session.

Body (strict): `{ razorpayPaymentId, razorpayOrderId, razorpaySignature }`.

HMAC-SHA256 of `order_id|payment_id` with `RAZORPAY_KEY_SECRET`. The payment must belong to the session user. Amount/currency/order linkage is checked against the internal payment (and Razorpay `payments.fetch` for the callback path). Finalization is the same function as the webhook.

## 5. Webhook verification

`POST /api/v1/webhooks/razorpay`

1. Read the **raw** body (`request.text()`). Do not JSON-parse then re-stringify.
2. HMAC-SHA256(raw body, `RAZORPAY_WEBHOOK_SECRET`) vs `X-Razorpay-Signature` (`timingSafeEqual`).
3. Invalid signature → `400` with a generic message.
4. Parse JSON only after a valid signature.

## 6. Webhook idempotency

Table `payment_events` with unique `(provider, provider_event_id)`.

- Capture webhooks: `payment.captured:{razorpay_payment_id}`
- Failure webhooks: `payment.failed:{razorpay_payment_id}`
- Frontend verify: `checkout.verify:{razorpay_payment_id}`

A second insert of the same event is a unique violation and is treated as already processed. Payment CAS `UPDATE … WHERE status = 'pending'` ensures only one transition to `paid`. Webhook + verify can insert two different event rows; only one CAS wins; the loser does not call `confirmInventorySale` again.

## 7. Payment state machine

Stored on `payments.status` (existing enum): `pending` → `paid` or `pending` → `failed`.

Not implemented here: `authorized`, `refunded`, `partially_refunded`.

`paid` is never downgraded to `failed` or `pending`. A `payment.failed` webhook after capture is ignored for the money/inventory state.

## 8. Order state machine

Existing `order_status` has **no** `paid` or `failed` value.

| Event | `orders.status` | `orders.payment_status` |
| --- | --- | --- |
| Checkout | `pending` | `pending` |
| Verified capture | `confirmed` | `paid` |
| Failure / unpaid cancel | `cancelled` | `failed` |

Each of those transitions writes `order_status_history`.

## 9. Inventory

| Event | Service | `reference_type` | `reference_id` |
| --- | --- | --- | --- |
| Checkout | `reserveInventory` | `order_item` | order item id |
| Unpaid fail/cancel | `releaseInventory` | `order_item_release` | order item id |
| Verified capture | `confirmInventorySale` | `order_item_sale` | order item id |

Confirmation uses a **new** ledger pair. It is not run at checkout. Unique `(reference_type, reference_id)` plus payment CAS keeps confirm/release idempotent.

Do not release after a sale has been confirmed. Do not confirm during checkout.

## 10. Failure handling

Verified `payment.failed` (while still pending): payment `failed`, order `cancelled`, `releaseInventory`. Repeated failure webhooks do not insert a second release ledger row.

Paid cancel: `409 ORDER_NOT_CANCELLABLE`. No automatic Razorpay refund.

## 11. Security

- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are server-only. Never `NEXT_PUBLIC_*`.
- Responses include `keyId` (public) and `razorpayOrderId` only.
- Logs redact secrets and signatures. Webhook raw bodies are not logged.
- Ownership: verify looks up the order with `findOrderForUser`.
- Amount, currency, and Razorpay order/payment relationship are server-checked.
- Strict Zod. No client `userId` / `paymentStatus` / `amount`.

## 12. Environment variables

Placeholders only (see `.env.example`):

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

Keys are optional at process boot so catalog tests still run. Checkout without configuration compensates the unpaid order and returns `503 PAYMENT_UNAVAILABLE`.

## 13. Razorpay Dashboard webhook configuration

Production URL:

`<production-base-url>/api/v1/webhooks/razorpay`

Do not use localhost as a production URL. Use HTTPS in production.

Enable only:

- `payment.captured`
- `payment.failed`

Set the webhook secret to the same value as `RAZORPAY_WEBHOOK_SECRET`. Dashboard test mode vs live mode must match the key id/secret pair. Razorpay retries on non-2xx; valid unknown events return `200` so they are not retried forever. Invalid signatures return `400`.

## 14. Phase 9 frontend contract

Checkout `201` `data`:

```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "MK-2026-XXXXXXXX",
    "status": "pending",
    "paymentStatus": "pending",
    "totalAmount": "1499.00",
    "totalAmountMinor": 149900,
    "currency": "INR"
  },
  "payment": {
    "provider": "razorpay",
    "status": "pending",
    "razorpayOrderId": "order_…",
    "keyId": "rzp_test_…",
    "amountMinor": 149900,
    "currency": "INR"
  }
}
```

Open Razorpay Checkout with `key`, `order_id`, `amount`, `currency`. On handler success, `POST /api/v1/payments/verify` with the three Razorpay fields. Treat the webhook as source of truth if the browser never calls verify.

## 15. Phase 8 limitations

- No Checkout.js UI, success/failure pages, or admin payment screens.
- No refunds, partial captures, or `authorized` handling.
- No `order.expired` event (use `payment.failed` / customer cancel).
- A Razorpay order may be orphaned if attach fails after HTTP success (internal order is then failed).
- Guest checkout is not in this phase.
- Live Razorpay calls are skipped in tests via `setPaymentProviderForTests`.
