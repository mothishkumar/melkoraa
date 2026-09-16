import { apiPage, apiRequest } from "@/src/api/client";
import type { OrderDetailDto, OrderSummaryDto } from "@/src/api/types/orders";

export const ordersApi = {
  list(query?: { page?: number; pageSize?: number }) {
    return apiPage<OrderSummaryDto>("/orders", query, true);
  },

  getById(orderId: string) {
    return apiRequest<OrderDetailDto>(`/orders/${encodeURIComponent(orderId)}`, {
      authenticated: true,
    });
  },

  cancel(orderId: string) {
    return apiRequest<OrderDetailDto>(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: "POST",
        authenticated: true,
      },
    );
  },
};
