import { apiRequest } from "@/src/api/client";
import type {
  CheckoutInput,
  CheckoutSessionDto,
  PaymentFinalizeResult,
  VerifyPaymentInput,
} from "@/src/api/types/payments";

export const checkoutApi = {
  createSession(input: CheckoutInput) {
    return apiRequest<CheckoutSessionDto>("/checkout", {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: true,
    });
  },

  verifyPayment(input: VerifyPaymentInput) {
    return apiRequest<PaymentFinalizeResult>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: true,
    });
  },
};
