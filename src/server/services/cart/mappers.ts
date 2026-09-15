import { cartLineAvailable } from "@/lib/cart/rules";
import { lineTotalMinor, minorToMoney, moneyToMinor } from "@/lib/catalog/money";
import type { CartDto, CartItemDto } from "@/types/cart";

type CartLine = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  livePrice: string;
  availableUnits: number | string;
  productStatus?: string;
  variantActive?: boolean;
};

export function mapCartItem(row: CartLine): CartItemDto {
  const unitPrice = row.livePrice;
  const unitPriceMinor = moneyToMinor(unitPrice);
  const lineMinor = lineTotalMinor(unitPriceMinor, row.quantity);
  const availableUnits = Number(row.availableUnits);
  const catalogVisible = row.productStatus !== "archived" && row.productStatus !== "draft" && row.variantActive !== false;
  return {
    variantId: row.variantId,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    sku: row.sku,
    size: row.size,
    color: row.color,
    quantity: row.quantity,
    unitPrice,
    unitPriceMinor,
    lineTotal: minorToMoney(lineMinor),
    lineTotalMinor: lineMinor,
    available: catalogVisible && cartLineAvailable(availableUnits, row.quantity),
  };
}

export function emptyCart(): CartDto {
  return {
    id: null,
    itemCount: 0,
    subtotal: "0.00",
    subtotalMinor: 0,
    items: [],
  };
}

export function mapCart(cartId: string | null, items: CartItemDto[]): CartDto {
  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  return {
    id: cartId,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: minorToMoney(subtotalMinor),
    subtotalMinor,
    items,
  };
}
