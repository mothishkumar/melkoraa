export const MAX_CART_ITEM_QUANTITY = 20;

export function canSetCartQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_CART_ITEM_QUANTITY;
}

/** Merge two add-to-cart quantities for the same variant. Null if over the cap. */
export function mergeCartQuantities(existing: number, incoming: number): number | null {
  if (!canSetCartQuantity(incoming)) return null;
  if (existing === 0) return incoming;
  if (!Number.isInteger(existing) || existing < 0) return null;
  const next = existing + incoming;
  return next <= MAX_CART_ITEM_QUANTITY ? next : null;
}

export function cartLineAvailable(availableUnits: number, quantity: number): boolean {
  return Number.isInteger(availableUnits) && availableUnits >= quantity && quantity >= 1;
}
