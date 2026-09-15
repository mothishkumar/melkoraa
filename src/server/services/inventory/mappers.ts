import type { InventoryLedgerEntry, InventoryListItem, InventorySnapshot } from "@/types/inventory";
import type { InventoryTransactionType } from "@/types/inventory";
import { availableQuantity } from "@/lib/inventory/rules";

type InventoryRow = {
  id: string;
  variantId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantitySold: number;
  reorderLevel: number;
  updatedAt: Date;
};

export function mapSnapshot(row: InventoryRow): InventorySnapshot {
  return {
    id: row.id,
    variantId: row.variantId,
    onHand: row.quantityOnHand,
    reserved: row.quantityReserved,
    sold: row.quantitySold,
    available: availableQuantity(row.quantityOnHand, row.quantityReserved),
    reorderLevel: row.reorderLevel,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapListItem(
  row: InventoryRow & {
    sku: string;
    size: string;
    color: string;
    productId: string;
    productName: string;
    productSlug: string;
  },
): InventoryListItem {
  return {
    ...mapSnapshot(row),
    sku: row.sku,
    size: row.size,
    color: row.color,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
  };
}

export function mapLedger(row: {
  id: string;
  variantId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
}): InventoryLedgerEntry {
  return {
    id: row.id,
    variantId: row.variantId,
    type: row.transactionType,
    quantity: row.quantity,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}
