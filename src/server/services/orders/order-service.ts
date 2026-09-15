import { getDb } from "@/db";
import { logger } from "@/lib/logger";
import { INVENTORY_REF_RELEASE } from "@/lib/orders/order-number";
import { conflictError, notFoundError } from "@/server/errors";
import * as orderRepo from "@/server/repositories/orders/order-repository";
import * as paymentRepo from "@/server/repositories/payments/payment-repository";
import { paginationMeta } from "@/server/http";
import { releaseInventory } from "@/server/services/inventory/inventory-service";
import { mapOrderDetail, mapOrderSummary } from "@/server/services/orders/mappers";
import type { OrderDetailDto } from "@/types/orders";

async function loadDetail(orderId: string): Promise<OrderDetailDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  const [items, payment] = await Promise.all([
    orderRepo.listOrderItems(orderId),
    paymentRepo.findPaymentForOrder(orderId),
  ]);
  return mapOrderDetail(order, items, payment);
}

export async function listCustomerOrders(userId: string, page: number, pageSize: number) {
  const { rows, total } = await orderRepo.listOrdersForUser(userId, page, pageSize);
  const itemsByOrder = await Promise.all(rows.map((row) => orderRepo.listOrderItems(row.id)));
  return {
    data: rows.map((row, index) => mapOrderSummary(row, itemsByOrder[index] ?? [])),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await orderRepo.findOrderForUser(userId, orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  return loadDetail(order.id);
}

export async function listAdminOrders(page: number, pageSize: number) {
  const { rows, total } = await orderRepo.listOrdersAdmin(page, pageSize);
  const itemsByOrder = await Promise.all(rows.map((row) => orderRepo.listOrderItems(row.id)));
  return {
    data: rows.map((row, index) => mapOrderSummary(row, itemsByOrder[index] ?? [])),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export async function getAdminOrder(orderId: string) {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  return loadDetail(order.id);
}

export function canCancelUnpaid(status: string, paymentStatus: string): boolean {
  return status === "pending" && paymentStatus === "pending";
}

export async function cancelCustomerOrder(userId: string, orderId: string) {
  const order = await orderRepo.findOrderForUser(userId, orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  if (!canCancelUnpaid(order.status, order.paymentStatus)) {
    throw conflictError(
      "ORDER_NOT_CANCELLABLE",
      "Only unpaid pending orders can be cancelled.",
    );
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const items = await orderRepo.listOrderItems(order.id, tx);
    for (const item of items) {
      if (!item.variantId) continue;
      await releaseInventory(
        item.variantId,
        item.quantity,
        {
          actorId: userId,
          referenceType: INVENTORY_REF_RELEASE,
          referenceId: item.id,
          notes: `Cancel ${order.orderNumber}`,
        },
        tx,
      );
    }
    await orderRepo.updateOrderStatus(order.id, "cancelled", tx, "failed");
    await orderRepo.insertStatusHistory(
      {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: "cancelled",
        changedBy: userId,
        notes: "Customer cancelled unpaid order. Reservation released.",
      },
      tx,
    );
    const payment = await paymentRepo.findPaymentForOrder(order.id, tx);
    if (payment && payment.status === "pending") {
      await paymentRepo.updatePaymentStatus(payment.id, "failed", tx);
    }
  });

  logger.info("order.cancelled", { resourceId: order.id, actorId: userId });
  return loadDetail(order.id);
}
