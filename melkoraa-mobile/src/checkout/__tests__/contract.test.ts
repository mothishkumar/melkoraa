import {
  buildCheckoutBody,
  buildVerifyBody,
  isVerifiedPaid,
} from "@/src/checkout/contract";

describe("checkout contract", () => {
  it("builds checkout body", () => {
    expect(buildCheckoutBody("addr-1", "key-1")).toEqual({
      addressId: "addr-1",
      idempotencyKey: "key-1",
    });
  });

  it("maps razorpay verify payload", () => {
    expect(
      buildVerifyBody({
        razorpay_payment_id: "pay_1",
        razorpay_order_id: "order_1",
        razorpay_signature: "sig_1",
      }),
    ).toEqual({
      razorpayPaymentId: "pay_1",
      razorpayOrderId: "order_1",
      razorpaySignature: "sig_1",
    });
  });

  it("detects paid status", () => {
    expect(isVerifiedPaid("paid")).toBe(true);
    expect(isVerifiedPaid("pending")).toBe(false);
  });
});
