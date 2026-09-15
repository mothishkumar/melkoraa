# MELKORAA cart and wishlist API

Phase 6 customer bag and wishlist. Inventory reservation is **not** part of this phase. Add-to-cart never calls `reserveInventory`, `releaseInventory`, or `confirmInventorySale`. Checkout (Phase 7) must reserve stock.

## Ownership

- `carts.user_id` and `wishlists.user_id` are the Supabase Auth user id (`auth.uid()`).
- Routes use Phase 3 `requireApiAuth()`. The authenticated user id is the only owner key. Client `userId`, `profileId`, and `cartId` are ignored (strict Zod rejects them).
- Every cart/wishlist query joins the owner row (`user_id = session user`). RLS from Phase 2 remains: customers see only their rows. `DATABASE_URL` / Drizzle typically bypasses RLS (same as catalog/inventory); API filters are the control plane and RLS is defense-in-depth for the Supabase JS client.
- No admin cart or wishlist APIs.
- Guest/`session_id` carts exist in the schema but are unused here.

GET cart does **not** insert a cart row. An empty DTO is returned until the first add. Wishlists are created by `handle_new_user`; GET still returns an empty DTO if none exists. The first add lazy-creates the parent row (`ON CONFLICT DO NOTHING` against the unique active-user / unique user indexes).

## Cart endpoints

| Method | Path |
| --- | --- |
| GET | `/api/v1/cart` |
| DELETE | `/api/v1/cart` (clear items; keep the cart row) |
| POST | `/api/v1/cart/items` `{ "variantId", "quantity" }` |
| PATCH | `/api/v1/cart/items/:variantId` `{ "quantity" }` |
| DELETE | `/api/v1/cart/items/:variantId` |

Unauthenticated → **401**.

Quantity: finite integer `1…20` (`MAX_CART_ITEM_QUANTITY`). Rejects `0`, negatives, decimals, `NaN`, `Infinity`. Adding the same variant increments the existing row. Unique `(cart_id, variant_id)` plus `INSERT … ON CONFLICT DO UPDATE` merges concurrent adds. Next quantity above 20 → **422** `CART_QUANTITY_LIMIT`.

Variant must exist, `is_active`, and the product must be `active` (Phase 4 public visibility). Missing / draft / archived / inactive → **404** `VARIANT_UNAVAILABLE` (no distinction that leaks catalog internals). Out-of-stock variants **can** be added; `available` is false when `on_hand - reserved < quantity`. Quantity is never auto-reduced.

`cart_items.unit_price` is NOT NULL, so the current catalog variant price is stored on add/patch. **GET always prices from live catalog prices** via Phase 4 `toMoneyString` / integer minor units. This is not an order snapshot.

### Cart DTO

```json
{
  "id": "uuid | null",
  "itemCount": 2,
  "subtotal": "2998.00",
  "subtotalMinor": 299800,
  "items": [
    {
      "variantId": "…",
      "productId": "…",
      "productName": "The Builder Cap",
      "productSlug": "the-builder-cap",
      "sku": "THE-BUILDER-CAP-BLK-OS",
      "size": "ONE SIZE",
      "color": "Black",
      "quantity": 2,
      "unitPrice": "1499.00",
      "unitPriceMinor": 149900,
      "lineTotal": "2998.00",
      "lineTotalMinor": 299800,
      "available": true
    }
  ]
}
```

Never includes `onHand`, `reserved`, `sold`, cost, or supplier.

## Wishlist endpoints

Product-based (not variant). Unique `(wishlist_id, product_id)`.

| Method | Path |
| --- | --- |
| GET | `/api/v1/wishlist` |
| POST | `/api/v1/wishlist/items` `{ "productId" }` |
| POST | `/api/v1/wishlist/items/toggle` `{ "productId" }` |
| DELETE | `/api/v1/wishlist/items/:productId` |

Duplicate add → **409** `WISHLIST_ITEM_EXISTS`. Inactive/archived/unknown product → **404** `PRODUCT_UNAVAILABLE`. DTO: `id`, `itemCount`, items with `productId`, `name`, `slug`, `price`, `priceMinor`, boolean `available` only.

## Errors

| Code | Status |
| --- | --- |
| `VALIDATION_ERROR` | 400 |
| `UNAUTHENTICATED` | 401 |
| `VARIANT_UNAVAILABLE` / `PRODUCT_UNAVAILABLE` / `CART_ITEM_NOT_FOUND` / `WISHLIST_ITEM_NOT_FOUND` | 404 |
| `WISHLIST_ITEM_EXISTS` | 409 |
| `CART_QUANTITY_LIMIT` | 422 |
| `INTERNAL` | 500 |

No raw Postgres errors.

## Concurrency

Two `POST /cart/items` for the same variant run `INSERT … ON CONFLICT (cart_id, variant_id) DO UPDATE SET quantity = quantity + excluded WHERE quantity + excluded <= 20`. Row locks on the unique index merge the adds. Two concurrent cart creates use `ON CONFLICT DO NOTHING` on the unique active-user index, then select.

## Future checkout

1. Cart remains a wish until checkout.
2. Checkout must call Phase 5 `reserveInventory` per line, then `confirmInventorySale` after payment (or `releaseInventory` on failure).
3. Add a unique ledger `(reference_type, reference_id)` before relying on retries.
