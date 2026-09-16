export type InventoryTransactionType =
  | "purchase"
  | "reservation"
  | "release"
  | "sale"
  | "adjustment"
  | "return";

export type InventorySnapshot = {
  id: string;
  variantId: string;
  onHand: number;
  reserved: number;
  sold: number;
  available: number;
  reorderLevel: number;
  updatedAt: string;
};

export type InventoryListItem = InventorySnapshot & {
  sku: string;
  size: string;
  color: string;
  productId: string;
  productName: string;
  productSlug: string;
};

export type InventoryLedgerEntry = {
  id: string;
  variantId: string;
  type: InventoryTransactionType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
};

export type InventoryDetail = InventoryListItem & {
  recentTransactions: InventoryLedgerEntry[];
};
