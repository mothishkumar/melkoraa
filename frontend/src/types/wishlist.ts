export type WishlistItemDto = {
  productId: string;
  name: string;
  slug: string;
  price: string;
  priceMinor: number;
  available: boolean;
};

export type WishlistDto = {
  id: string | null;
  itemCount: number;
  items: WishlistItemDto[];
};
