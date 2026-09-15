# MELKORAA customer storefront (Phase 9)

Customer UI on the existing Phase 3–8 APIs and services. No admin UI. No second app.

## Routes

| Path | Auth | Source |
| --- | --- | --- |
| `/` | public | Home / DROP 001 |
| `/drop-001` | public | Drop landing + catalog `drop=drop-001` |
| `/products` | public | Listing. Query: `category`, `drop`, `collection`, `sort`, `search`, `page`, `isNew` |
| `/products/[slug]` | public | PDP |
| `/shop`, `/product/[slug]` | — | Redirects to `/products` |
| `/cart` | public page; bag APIs require session | Bag |
| `/wishlist` | session | Wishlist |
| `/checkout` | session | Address + Razorpay |
| `/order/[orderId]` | session + owner | Confirmation |
| `/account` `/account/orders` `/account/orders/[id]` `/account/addresses` | session | Account |
| `/login` `/register` `/forgot-password` `/reset-password` `/verify-email` | Phase 3 | Auth |

## API integration

Server Components load catalog, cart, wishlist, orders, and addresses through **existing services** (same code as `/api/v1/...`). Mutations from the browser use the typed client in `src/lib/api/**`:

- Cart: `GET/DELETE /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH/DELETE /api/v1/cart/items/:variantId`
- Wishlist: `GET /api/v1/wishlist`, `POST .../toggle`, `DELETE .../:productId`
- Checkout: `POST /api/v1/checkout` `{ addressId, idempotencyKey }` only
- Verify: `POST /api/v1/payments/verify`
- Orders: `GET /api/v1/orders`, `GET /api/v1/orders/:id`, `POST .../cancel`
- Addresses: `GET/POST /api/v1/addresses`, `PATCH/DELETE /api/v1/addresses/:addressId`

## Authentication

Phase 3 Supabase Auth. Protected prefixes: `/account`, `/checkout`, `/wishlist`, `/order`, `/admin`. Unauthenticated users go to `/login?next=` with `getSafeRedirectPath`. Staff still land on `/admin` after login. Customers never send `userId`.

`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required in the browser. Service role is never imported in client modules.

## Cart / wishlist

Bag totals on `/cart` are estimates from live catalog prices on the cart DTO. Checkout recomputes the payable amount. Guest bag is not persisted (backend has no guest cart). Wishlist requires login.

## Checkout + Razorpay

1. Select/create address (own rows only).
2. Click Pay → `POST /checkout` with a `sessionStorage` idempotency UUID (reused on retry; cleared after verified paid or provider-unavailable failure).
3. Open Razorpay Checkout.js with **public** `keyId` and `razorpayOrderId` from the server.
4. Handler posts `razorpay_payment_id` / `order_id` / `signature` to `/api/v1/payments/verify`.
5. Success copy and `/order/...` “ORDER CONFIRMED” only if `paymentStatus === paid`.

Webhook remains authoritative. The UI does not set paid locally.

## Order confirmation

`/order/[orderId]` uses `getCustomerOrder`. Other users receive a 404. Cancel is shown only when `canCancelUnpaid` is true. No refunds.

## Environment

Same as Phase 3 + 8. Razorpay secret and webhook secret stay server-only. Checkout still needs `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` on the server.

## Limitations

- No guest checkout/cart.
- No coupons, tax, or shipping quotes.
- Wishlist DTOs have no images.
- Privacy/terms are placeholders (no invented legal copy).
- Razorpay Checkout.js loads from Razorpay’s CDN on the client.
- Journal is still a stub.
- Catalog pages share the existing single Postgres pooler connection; first listing after a cold query can take several seconds.
