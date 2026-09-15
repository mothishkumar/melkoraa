import { logger } from "@/lib/logger";
import { conflictError, notFoundError } from "@/server/errors";
import * as orderRepo from "@/server/repositories/orders/order-repository";
import * as paymentRepo from "@/server/repositories/payments/payment-repository";
import { paginationMeta } from "@/server/http";
import { mapOrderDetail, mapOrderSummary } from "@/server/services/orders/mappers";
import { failUnpaidOrder } from "@/server/services/payments/payment-service";
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
      order.paymentStatus === "paid"
        ? "Paid orders cannot be cancelled from this endpoint. Refunds are not issued automatically."
        : "Only unpaid pending orders can be cancelled.",
    );
  }

  const result = await failUnpaidOrder(
    order.id,
    userId,
    "Customer cancelled unpaid order. Reservation released.",
  );
  if (!result.applied) {
    throw conflictError(
      "ORDER_NOT_CANCELLABLE",
      result.reason === "already_paid"
        ? "Paid orders cannot be cancelled from this endpoint."
        : "Only unpaid pending orders can be cancelled.",
    );
  }

  logger.info("order.cancelled", { resourceId: order.id, actorId: userId });
  return loadDetail(order.id);
}
