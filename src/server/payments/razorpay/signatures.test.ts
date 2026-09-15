import { describe, expect, it } from "vitest";

import {
  signCheckoutPayload,
  signWebhookBody,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "@/server/payments/razorpay/signatures";

const webhookSecret = "test_webhook_secret_placeholder";
const keySecret = "test_key_secret_placeholder";

describe("Razorpay signatures", () => {
  it("accepts a valid webhook signature over the exact raw body", () => {
    const raw = '{"event":"payment.captured"}';
    const signature = signWebhookBody(raw, webhookSecret);
    expect(verifyWebhookSignature(raw, signature, webhookSecret)).toBe(true);
  });

  it("rejects an invalid webhook signature", () => {
    const raw = '{"event":"payment.captured"}';
    expect(verifyWebhookSignature(raw, "deadbeef", webhookSecret)).toBe(false);
  });

  it("rejects a modified body with the original signature", () => {
    const raw = '{"event":"payment.captured"}';
    const signature = signWebhookBody(raw, webhookSecret);
    expect(verifyWebhookSignature(`${raw} `, signature, webhookSecret)).toBe(false);
  });

  it("accepts a valid checkout payment signature", () => {
    const razorpayOrderId = "order_test_1";
    const razorpayPaymentId = "pay_test_1";
    const razorpaySignature = signCheckoutPayload(razorpayOrderId, razorpayPaymentId, keySecret);
    expect(
      verifyCheckoutSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        keySecret,
      }),
    ).toBe(true);
  });

  it("rejects an invalid checkout payment signature", () => {
    expect(
      verifyCheckoutSignature({
        razorpayOrderId: "order_test_1",
        razorpayPaymentId: "pay_test_1",
        razorpaySignature: "00",
        keySecret,
      }),
    ).toBe(false);
  });
});
