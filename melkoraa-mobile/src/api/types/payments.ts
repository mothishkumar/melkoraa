export type CheckoutOrderDto = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  totalAmountMinor: number;
  currency: string;
};

export type CheckoutPaymentDto = {
  provider: "razorpay";
  status: string;
  razorpayOrderId: string | null;
  keyId: string | null;
  amountMinor: number;
  currency: string;
};

export type CheckoutSessionDto = {
  order: CheckoutOrderDto;
  payment: CheckoutPaymentDto;
};

export type CheckoutInput = {
  addressId: string;
  idempotencyKey: string;
  billingAddressId?: string;
};

export type VerifyPaymentInput = {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

export type PaymentFinalizeResult = {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  alreadyFinalized: boolean;
};
