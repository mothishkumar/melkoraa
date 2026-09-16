export function buildCheckoutBody(addressId: string, idempotencyKey: string) {
  return {
    addressId,
    idempotencyKey,
  };
}

export function buildVerifyBody(input: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) {
  return {
    razorpayPaymentId: input.razorpay_payment_id,
    razorpayOrderId: input.razorpay_order_id,
    razorpaySignature: input.razorpay_signature,
  };
}

export function checkoutStorageKey(userId: string) {
  return `melkoraa.checkout.idempotency.${userId}`;
}

export function isVerifiedPaid(paymentStatus: string) {
  return paymentStatus === "paid";
}

export function paymentHeadline(paymentStatus: string, orderStatus: string) {
  if (paymentStatus === "paid") return "ORDER CONFIRMED";
  if (paymentStatus === "failed" || orderStatus === "cancelled") return "PAYMENT FAILED";
  return "PAYMENT PROCESSING";
}
