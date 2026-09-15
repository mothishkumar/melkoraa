import * as productsRepo from "@/server/repositories/catalog/product-repository";
import * as inventoryRepo from "@/server/repositories/inventory/inventory-repository";
import * as orderRepo from "@/server/repositories/orders/order-repository";
import { mapLedger } from "@/server/services/inventory/mappers";
import { mapOrderSummary } from "@/server/services/orders/mappers";
import type { AdminDashboardSnapshot } from "@/types/admin";

function countFor(
  rows: Array<{ status?: string; paymentStatus?: string; value: number | string }>,
  key: string,
  field: "status" | "paymentStatus" = "status",
) {
  return Number(rows.find((row) => row[field] === key)?.value ?? 0);
}

export async function getAdminDashboard(): Promise<AdminDashboardSnapshot> {
  const [productRows, inventory, orderStatus, paymentStatus, recentOrders, ledger] =
    await Promise.all([
      productsRepo.countProductsByStatus(),
      inventoryRepo.countInventoryStates(),
      orderRepo.countOrdersByStatus(),
      orderRepo.countOrdersByPaymentStatus(),
      orderRepo.listOrdersAdmin({ page: 1, pageSize: 8 }),
      inventoryRepo.listRecentLedger(12),
    ]);

  const itemsByOrder = await Promise.all(
    recentOrders.rows.map((row) => orderRepo.listOrderItems(row.id)),
  );

  const productMap = Object.fromEntries(
    productRows.map((row) => [row.status, Number(row.value)]),
  );

  return {
    products: {
      total: Object.values(productMap).reduce((sum, value) => sum + value, 0),
      active: productMap.active ?? 0,
      draft: productMap.draft ?? 0,
      archived: productMap.archived ?? 0,
    },
    inventory: {
      total: inventory.total,
      inStock: inventory.inStock,
      lowStock: inventory.lowStock,
      outOfStock: inventory.outOfStock,
    },
    orders: {
      pending: countFor(orderStatus, "pending"),
      confirmed: countFor(orderStatus, "confirmed"),
      cancelled: countFor(orderStatus, "cancelled"),
      paid: countFor(paymentStatus, "paid", "paymentStatus"),
    },
    recentOrders: recentOrders.rows.map((row, index) => ({
      ...mapOrderSummary(row, itemsByOrder[index] ?? []),
      userId: row.userId,
    })),
    recentInventory: ledger.map(mapLedger),
  };
}
