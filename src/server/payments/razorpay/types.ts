export type RazorpayCreatedOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

export type RazorpayFetchedPayment = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
};

export type PaymentProvider = {
  createOrder(input: {
    amountPaise: number;
    currency: "INR";
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayCreatedOrder>;
  fetchPayment(providerPaymentId: string): Promise<RazorpayFetchedPayment>;
};

export function createMockPaymentProvider(
  options?: Partial<{
    orderId: string;
    payments: Map<string, RazorpayFetchedPayment>;
  }>,
): PaymentProvider & { created: RazorpayCreatedOrder[]; payments: Map<string, RazorpayFetchedPayment> } {
  const created: RazorpayCreatedOrder[] = [];
  const payments = options?.payments ?? new Map<string, RazorpayFetchedPayment>();
  return {
    created,
    payments,
    async createOrder(input) {
      const order: RazorpayCreatedOrder = {
        id: options?.orderId ?? `order_test_${created.length + 1}`,
        amount: input.amountPaise,
        currency: input.currency,
        receipt: input.receipt,
      };
      created.push(order);
      return order;
    },
    async fetchPayment(id) {
      const found = payments.get(id);
      if (!found) {
        throw new Error("RAZORPAY_PAYMENT_NOT_FOUND");
      }
      return found;
    },
  };
}
