import { moneyToMinor, toMoneyString } from "@/lib/catalog/money";
import type { WishlistDto, WishlistItemDto } from "@/types/wishlist";

type WishlistLine = {
  productId: string;
  name: string;
  slug: string;
  price: string;
  available: boolean | null;
};

export function mapWishlistItem(row: WishlistLine): WishlistItemDto {
  const price = toMoneyString(row.price);
  return {
    productId: row.productId,
    name: row.name,
    slug: row.slug,
    price,
    priceMinor: moneyToMinor(price),
    available: Boolean(row.available),
  };
}

export function emptyWishlist(): WishlistDto {
  return { id: null, itemCount: 0, items: [] };
}

export function mapWishlist(id: string | null, items: WishlistItemDto[]): WishlistDto {
  return { id, itemCount: items.length, items };
}
