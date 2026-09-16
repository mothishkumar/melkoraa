import { checkoutApi } from "@/src/api/checkout";
import { isAuthRequiredError } from "@/src/api/errors";
import type {
  CheckoutInput,
  CheckoutSessionDto,
  PaymentFinalizeResult,
  VerifyPaymentInput,
} from "@/src/api/types/payments";

export type CheckoutResult<T> =
  | { status: "success"; data: T }
  | { status: "auth_required" }
  | { status: "error"; message: string };

async function wrap<T>(fn: () => Promise<T>): Promise<CheckoutResult<T>> {
  try {
    return { status: "success", data: await fn() };
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return { status: "auth_required" };
    }
    const message =
      error instanceof Error ? error.message : "Checkout could not be completed.";
    return { status: "error", message };
  }
}

export const checkoutService = {
  createSession(input: CheckoutInput): Promise<CheckoutResult<CheckoutSessionDto>> {
    return wrap(() => checkoutApi.createSession(input));
  },

  verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<CheckoutResult<PaymentFinalizeResult>> {
    return wrap(() => checkoutApi.verifyPayment(input));
  },
};
