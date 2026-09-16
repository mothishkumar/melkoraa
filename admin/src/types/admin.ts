import type { ProductStatus } from "@/types";
import type { InventoryLedgerEntry } from "@/types/inventory";
import type { OrderSummaryDto } from "@/types/orders";

export type AdminDashboardSnapshot = {
  products: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  inventory: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  orders: {
    pending: number;
    confirmed: number;
    cancelled: number;
    paid: number;
  };
  recentOrders: AdminOrderSummary[];
  recentInventory: InventoryLedgerEntry[];
};

export type AdminOrderSummary = OrderSummaryDto & {
  userId: string | null;
};

export type AdminOrderHistoryEntry = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  notes: string | null;
  createdAt: string;
};

export type AdminCustomer = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  orderCount: number;
};

export type AdminPayment = {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  status: "pending" | "authorized" | "paid" | "failed" | "refunded" | "partially_refunded";
  amount: string;
  currency: string;
  createdAt: string;
};

export type AdminAuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminProductStatus = ProductStatus;
