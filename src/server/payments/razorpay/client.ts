import "server-only";

import Razorpay from "razorpay";
import { getServerEnv } from "@/lib/env/server";
import type { PaymentProvider, RazorpayCreatedOrder, RazorpayFetchedPayment } from "./types";

class RazorpayHttpProvider implements PaymentProvider {
  private readonly client: Razorpay;

  constructor(keyId: string, keySecret: string) {
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async createOrder(input: {
    amountPaise: number;
    currency: "INR";
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayCreatedOrder> {
    const order = await this.client.orders.create({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });
    return {
      id: String(order.id),
      amount: Number(order.amount),
      currency: String(order.currency),
      receipt: order.receipt ? String(order.receipt) : input.receipt,
    };
  }

  async fetchPayment(providerPaymentId: string): Promise<RazorpayFetchedPayment> {
    const payment = await this.client.payments.fetch(providerPaymentId);
    return {
      id: String(payment.id),
      orderId: String(payment.order_id),
      amount: Number(payment.amount),
      currency: String(payment.currency),
      status: String(payment.status),
    };
  }
}

let testOverride: PaymentProvider | null = null;

export function setPaymentProviderForTests(provider: PaymentProvider | null): void {
  testOverride = provider;
}

export function getPaymentProvider(): PaymentProvider {
  if (testOverride) {
    return testOverride;
  }
  const env = getServerEnv();
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_NOT_CONFIGURED");
  }
  return new RazorpayHttpProvider(keyId, keySecret);
}

export function isRazorpayConfigured(): boolean {
  if (testOverride) {
    return true;
  }
  const env = getServerEnv();
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayPublicKeyId(): string | null {
  return getServerEnv().RAZORPAY_KEY_ID ?? null;
}

export function getRazorpayKeySecret(): string | null {
  return getServerEnv().RAZORPAY_KEY_SECRET ?? null;
}

export function getRazorpayWebhookSecret(): string | null {
  return getServerEnv().RAZORPAY_WEBHOOK_SECRET ?? null;
}
