import { apiRequest } from "./client";
import type { OrderDetailDto } from "@/types/orders";

export function fetchOrder(orderId: string) {
  return apiRequest<OrderDetailDto>(`/api/v1/orders/${orderId}`);
}
