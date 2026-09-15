import { createHmac, timingSafeEqual } from "node:crypto";

function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqualHex(expectedHex: string, provided: string): boolean {
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Razorpay webhook: HMAC-SHA256(rawBody, webhook_secret) compared to X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }
  const expected = hmacSha256Hex(webhookSecret, rawBody);
  return safeEqualHex(expected, signature);
}

/** Checkout callback: HMAC-SHA256(`${orderId}|${paymentId}`, key_secret). */
export function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  keySecret: string;
}): boolean {
  const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expected = hmacSha256Hex(input.keySecret, payload);
  return safeEqualHex(expected, input.razorpaySignature);
}

export function signWebhookBody(rawBody: string, webhookSecret: string): string {
  return hmacSha256Hex(webhookSecret, rawBody);
}

export function signCheckoutPayload(razorpayOrderId: string, razorpayPaymentId: string, keySecret: string): string {
  return hmacSha256Hex(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`);
}
