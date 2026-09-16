import { ordersApi } from "@/src/api/orders";
import { isAuthRequiredError } from "@/src/api/errors";
import type { OrderDetailDto, OrderSummaryDto } from "@/src/api/types/orders";
import type { PaginatedResponse } from "@/src/api/types/common";

export type OrderResult<T> =
  | { status: "success"; data: T }
  | { status: "auth_required" }
  | { status: "error"; message: string };

async function wrap<T>(fn: () => Promise<T>): Promise<OrderResult<T>> {
  try {
    return { status: "success", data: await fn() };
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return { status: "auth_required" };
    }
    const message =
      error instanceof Error ? error.message : "Unable to load orders.";
    return { status: "error", message };
  }
}

export const orderService = {
  list(page = 1, pageSize = 20): Promise<OrderResult<PaginatedResponse<OrderSummaryDto>>> {
    return wrap(() => ordersApi.list({ page, pageSize }));
  },

  getById(orderId: string): Promise<OrderResult<OrderDetailDto>> {
    return wrap(() => ordersApi.getById(orderId));
  },

  cancel(orderId: string): Promise<OrderResult<OrderDetailDto>> {
    return wrap(() => ordersApi.cancel(orderId));
  },
};
