export const MAX_STOCK_DELTA = 1_000_000;

export function availableQuantity(onHand: number, reserved: number): number {
  return onHand - reserved;
}

export function canAdjustOnHand(
  onHand: number,
  reserved: number,
  delta: number,
): boolean {
  if (!Number.isInteger(delta) || delta === 0) return false;
  const next = onHand + delta;
  return next >= 0 && next >= reserved;
}

export function canReserve(
  onHand: number,
  reserved: number,
  quantity: number,
): boolean {
  return Number.isInteger(quantity) && quantity > 0 && availableQuantity(onHand, reserved) >= quantity;
}

export function canRelease(reserved: number, quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0 && reserved >= quantity;
}

export function canConfirmSale(reserved: number, quantity: number): boolean {
  return canRelease(reserved, quantity);
}

export function applyAdjust(
  onHand: number,
  reserved: number,
  sold: number,
  delta: number,
): { onHand: number; reserved: number; sold: number } | null {
  if (!canAdjustOnHand(onHand, reserved, delta)) return null;
  return { onHand: onHand + delta, reserved, sold };
}

export function applyReserve(
  onHand: number,
  reserved: number,
  sold: number,
  quantity: number,
): { onHand: number; reserved: number; sold: number } | null {
  if (!canReserve(onHand, reserved, quantity)) return null;
  return { onHand, reserved: reserved + quantity, sold };
}

export function applyRelease(
  onHand: number,
  reserved: number,
  sold: number,
  quantity: number,
): { onHand: number; reserved: number; sold: number } | null {
  if (!canRelease(reserved, quantity)) return null;
  return { onHand, reserved: reserved - quantity, sold };
}

export function applyConfirmSale(
  onHand: number,
  reserved: number,
  sold: number,
  quantity: number,
): { onHand: number; reserved: number; sold: number } | null {
  if (!canConfirmSale(reserved, quantity)) return null;
  return { onHand, reserved: reserved - quantity, sold: sold + quantity };
}
