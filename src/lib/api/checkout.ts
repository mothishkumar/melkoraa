import { apiRequest } from "@/lib/api/client";
import { buildCheckoutBody, buildVerifyBody } from "@/features/checkout/contract";
import type { CheckoutSessionDto } from "@/types/payments";
import type { OrderDetailDto } from "@/types/orders";

export function checkoutRequest(addressId: string, idempotencyKey: string) {
  return apiRequest<CheckoutSessionDto>("/api/v1/checkout", {
    method: "POST",
    body: JSON.stringify(buildCheckoutBody(addressId, idempotencyKey)),
  });
}

export function verifyPaymentRequest(input: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) {
  return apiRequest<{
    order: CheckoutSessionDto["order"];
    payment: CheckoutSessionDto["payment"];
    alreadyFinalized: boolean;
  }>("/api/v1/payments/verify", {
    method: "POST",
    body: JSON.stringify(buildVerifyBody(input)),
  });
}

export function cancelOrderRequest(orderId: string) {
  return apiRequest<OrderDetailDto>(`/api/v1/orders/${orderId}/cancel`, {
    method: "POST",
  });
}
