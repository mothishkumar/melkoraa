export type CartItemDto = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: string;
  unitPriceMinor: number;
  lineTotal: string;
  lineTotalMinor: number;
  available: boolean;
};

export type CartDto = {
  id: string | null;
  itemCount: number;
  subtotal: string;
  subtotalMinor: number;
  items: CartItemDto[];
};
