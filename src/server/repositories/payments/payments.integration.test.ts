import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { beforeAll, describe, expect, it } from "vitest";

import { loadProjectEnv } from "@/lib/env/load";
import {
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";
import {
  addresses,
  cartItems,
  carts,
  inventory,
  inventoryTransactions,
  orderItems,
  orderStatusHistory,
  orders,
  paymentEvents,
  payments,
  products,
  productVariants,
} from "@/db/schema";
import * as schema from "@/db/schema";
import * as cartRepo from "@/server/repositories/cart/cart-repository";
import { checkout } from "@/server/services/checkout/checkout-service";
import {
  processRazorpayWebhook,
  verifyCustomerCheckoutPayment,
} from "@/server/services/payments/payment-service";
import { AppError } from "@/server/errors";
import {
  createMockPaymentProvider,
  setPaymentProviderForTests,
  signCheckoutPayload,
  signWebhookBody,
} from "@/server/payments/razorpay";

function ensureDatabaseUrl(): string {
  loadProjectEnv();
  try {
    const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const entry of envFile.split(/\r?\n/)) {
      if (!entry || entry.startsWith("#") || !entry.includes("=")) continue;
      const eqIdx = entry.indexOf("=");
      const key = entry.slice(0, eqIdx).trim();
      let value = entry.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
  return process.env.DATABASE_URL ?? "";
}

const databaseUrl = ensureDatabaseUrl();
loadProjectEnv();
const canRun =
  (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const WEBHOOK_SECRET = "test_webhook_secret_placeholder";
const KEY_SECRET = "test_key_secret_placeholder";

function capturedBody(orderId: string, paymentId: string, amount: number) {
  return JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });
}

function failedBody(orderId: string, paymentId: string, amount: number) {
  return JSON.stringify({
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount,
          currency: "INR",
          status: "failed",
        },
      },
    },
  });
}

describe.skipIf(!canRun)("razorpay payment finalization", () => {
  beforeAll(() => {
    process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || WEBHOOK_SECRET;
  });

  async function setupUser() {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = `phase8-${Date.now()}-${Math.random().toString(16).slice(2)}@melkoraa.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "Phase8Test!ok",
      email_confirm: true,
      user_metadata: { full_name: "Phase 8" },
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    const sql = postgres(requirePostgresConnectionString(process.env.DATABASE_URL, "DATABASE_URL"), runtimePostgresOptions);
    const db = drizzle(sql, { schema });
    await new Promise((r) => setTimeout(r, 400));
    const [address] = await db
      .insert(addresses)
      .values({
        userId: data.user.id,
        name: "Phase 8",
        addressLine1: "1 Builder St",
        city: "Chennai",
        state: "TN",
        postalCode: "600001",
        country: "IN",
      })
      .returning();
    const [product] = await db
      .insert(products)
      .values({
        name: "Phase 8 Pay Fixture",
        slug: `phase8-${crypto.randomUUID()}`,
        status: "active",
        basePrice: "100.00",
      })
      .returning();
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId: product!.id,
        sku: `P8-${crypto.randomUUID().slice(0, 8)}`,
        size: "M",
        color: "Black",
        price: "100.00",
      })
      .returning();
    await db.insert(inventory).values({
      variantId: variant!.id,
      quantityOnHand: 5,
      quantityReserved: 0,
      quantitySold: 0,
    });
    await db.insert(carts).values({ userId: data.user.id, status: "active" });
    const cart = await cartRepo.findActiveCartByUserId(data.user.id, db);
    await cartRepo.upsertCartItemQuantity(cart!.id, variant!.id, 1, "999.00", db);
    return {
      admin,
      sql,
      db,
      userId: data.user.id,
      addressId: address!.id,
      productId: product!.id,
      variantId: variant!.id,
    };
  }

  async function cleanup(ctx: Awaited<ReturnType<typeof setupUser>>) {
    const { db, sql, admin, userId, variantId, productId } = ctx;
    try {
      const itemRows = await db.select().from(orderItems).where(eq(orderItems.variantId, variantId));
      for (const item of itemRows) {
        const payRows = await db.select().from(payments).where(eq(payments.orderId, item.orderId));
        for (const pay of payRows) {
          await db.delete(paymentEvents).where(eq(paymentEvents.paymentId, pay.id));
        }
        await db.delete(payments).where(eq(payments.orderId, item.orderId));
        await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, item.orderId));
        await db.delete(orderItems).where(eq(orderItems.orderId, item.orderId));
        await db.delete(orders).where(eq(orders.id, item.orderId));
      }
      await db.delete(inventoryTransactions).where(eq(inventoryTransactions.variantId, variantId));
      await db.delete(inventory).where(eq(inventory.variantId, variantId));
      await db.delete(productVariants).where(eq(productVariants.id, variantId));
      await db.delete(products).where(eq(products.id, productId));
      const userCarts = await db.select().from(carts).where(eq(carts.userId, userId));
      for (const cart of userCarts) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
      await db.delete(carts).where(eq(carts.userId, userId));
      await db.delete(addresses).where(eq(addresses.userId, userId));
    } finally {
      setPaymentProviderForTests(null);
      await sql.end({ timeout: 0 });
      await admin.auth.admin.deleteUser(userId);
    }
  }

  it("marks paid, confirms inventory once, and is idempotent on webhook retries", async () => {
    const ctx = await setupUser();
    const mock = createMockPaymentProvider({ orderId: `order_${crypto.randomUUID().slice(0, 8)}` });
    setPaymentProviderForTests(mock);
    try {
      const session = await checkout(ctx.userId, {
        addressId: ctx.addressId,
        idempotencyKey: crypto.randomUUID(),
      });
      const razorpayOrderId = session.payment.razorpayOrderId!;
      const payId = `pay_${crypto.randomUUID().slice(0, 8)}`;
      const raw = capturedBody(razorpayOrderId, payId, 10000);
      const signature = signWebhookBody(raw, process.env.RAZORPAY_WEBHOOK_SECRET!);

      const first = await processRazorpayWebhook({ rawBody: raw, signature });
      const second = await processRazorpayWebhook({ rawBody: raw, signature });
      expect(first.action).toBe("paid");
      expect(second.alreadyFinalized).toBe(true);

      const [payment] = await ctx.db.select().from(payments).where(eq(payments.orderId, session.order.id));
      expect(payment?.status).toBe("paid");
      expect(payment?.providerPaymentId).toBe(payId);

      const [order] = await ctx.db.select().from(orders).where(eq(orders.id, session.order.id));
      expect(order?.status).toBe("confirmed");
      expect(order?.paymentStatus).toBe("paid");

      const history = await ctx.db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, session.order.id));
      expect(history.some((row) => row.newStatus === "confirmed")).toBe(true);

      const [stock] = await ctx.db.select().from(inventory).where(eq(inventory.variantId, ctx.variantId));
      expect(stock?.quantityReserved).toBe(0);
      expect(stock?.quantitySold).toBe(1);
      expect(stock?.quantityOnHand).toBe(5);

      const sales = await ctx.db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.variantId, ctx.variantId));
      expect(sales.filter((row) => row.transactionType === "sale")).toHaveLength(1);

      const events = await ctx.db.select().from(paymentEvents);
      const forPayment = events.filter((row) => row.paymentId === payment?.id);
      expect(forPayment).toHaveLength(1);

      const failedRaw = failedBody(razorpayOrderId, payId, 10000);
      const failedSig = signWebhookBody(failedRaw, process.env.RAZORPAY_WEBHOOK_SECRET!);
      const ignored = await processRazorpayWebhook({ rawBody: failedRaw, signature: failedSig });
      expect(ignored.action).toBe("failed");
      const [stillPaid] = await ctx.db.select().from(payments).where(eq(payments.orderId, session.order.id));
      expect(stillPaid?.status).toBe("paid");
    } finally {
      await cleanup(ctx);
    }
  }, 60_000);

  it("releases reservation on payment.failed and does not release twice", async () => {
    const ctx = await setupUser();
    const mock = createMockPaymentProvider({ orderId: `order_${crypto.randomUUID().slice(0, 8)}` });
    setPaymentProviderForTests(mock);
    try {
      const session = await checkout(ctx.userId, {
        addressId: ctx.addressId,
        idempotencyKey: crypto.randomUUID(),
      });
      const razorpayOrderId = session.payment.razorpayOrderId!;
      const payId = `pay_${crypto.randomUUID().slice(0, 8)}`;
      const raw = failedBody(razorpayOrderId, payId, 10000);
      const signature = signWebhookBody(raw, process.env.RAZORPAY_WEBHOOK_SECRET!);
      await processRazorpayWebhook({ rawBody: raw, signature });
      await processRazorpayWebhook({ rawBody: raw, signature });

      const [payment] = await ctx.db.select().from(payments).where(eq(payments.orderId, session.order.id));
      expect(payment?.status).toBe("failed");
      const [order] = await ctx.db.select().from(orders).where(eq(orders.id, session.order.id));
      expect(order?.status).toBe("cancelled");
      const [stock] = await ctx.db.select().from(inventory).where(eq(inventory.variantId, ctx.variantId));
      expect(stock?.quantityReserved).toBe(0);
      expect(stock?.quantitySold).toBe(0);
      expect(stock?.quantityOnHand).toBe(5);
      const releases = (await ctx.db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.variantId, ctx.variantId)))
        .filter((row) => row.transactionType === "release");
      expect(releases).toHaveLength(1);
    } finally {
      await cleanup(ctx);
    }
  }, 60_000);

  it("rejects amount and currency mismatches", async () => {
    const ctx = await setupUser();
    const mock = createMockPaymentProvider({ orderId: `order_${crypto.randomUUID().slice(0, 8)}` });
    setPaymentProviderForTests(mock);
    try {
      const session = await checkout(ctx.userId, {
        addressId: ctx.addressId,
        idempotencyKey: crypto.randomUUID(),
      });
      const razorpayOrderId = session.payment.razorpayOrderId!;
      const raw = capturedBody(razorpayOrderId, "pay_mismatch", 1);
      const signature = signWebhookBody(raw, process.env.RAZORPAY_WEBHOOK_SECRET!);
      await expect(processRazorpayWebhook({ rawBody: raw, signature })).rejects.toSatisfy(
        (error) => error instanceof AppError && error.code === "PAYMENT_MISMATCH",
      );

      const currencyRaw = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_currency",
              order_id: razorpayOrderId,
              amount: 10000,
              currency: "USD",
              status: "captured",
            },
          },
        },
      });
      const currencySig = signWebhookBody(currencyRaw, process.env.RAZORPAY_WEBHOOK_SECRET!);
      await expect(
        processRazorpayWebhook({ rawBody: currencyRaw, signature: currencySig }),
      ).rejects.toSatisfy((error) => error instanceof AppError && error.code === "PAYMENT_MISMATCH");

      const [payment] = await ctx.db.select().from(payments).where(eq(payments.orderId, session.order.id));
      expect(payment?.status).toBe("pending");
    } finally {
      await cleanup(ctx);
    }
  }, 60_000);

  it("rejects invalid webhook signatures and unknown events stay no-ops", async () => {
    const raw = capturedBody("order_x", "pay_x", 10000);
    await expect(
      processRazorpayWebhook({ rawBody: raw, signature: "nope" }),
    ).rejects.toSatisfy((error) => error instanceof AppError && error.status === 400);

    const unknown = JSON.stringify({ event: "order.paid", payload: {} });
    const signature = signWebhookBody(unknown, process.env.RAZORPAY_WEBHOOK_SECRET || WEBHOOK_SECRET);
    const result = await processRazorpayWebhook({ rawBody: unknown, signature });
    expect(result.action).toBe("ignored");
  });

  it("verifies checkout signatures and rejects another customer's payment", async () => {
    const ctx = await setupUser();
    const payId = `pay_${crypto.randomUUID().slice(0, 8)}`;
    const mock = createMockPaymentProvider({ orderId: `order_${crypto.randomUUID().slice(0, 8)}` });
    setPaymentProviderForTests(mock);
    try {
      const session = await checkout(ctx.userId, {
        addressId: ctx.addressId,
        idempotencyKey: crypto.randomUUID(),
      });
      const razorpayOrderId = session.payment.razorpayOrderId!;
      mock.payments.set(payId, {
        id: payId,
        orderId: razorpayOrderId,
        amount: 10000,
        currency: "INR",
        status: "captured",
      });

      const signature = signCheckoutPayload(
        razorpayOrderId,
        payId,
        process.env.RAZORPAY_KEY_SECRET || KEY_SECRET,
      );
      const verified = await verifyCustomerCheckoutPayment(ctx.userId, {
        razorpayOrderId,
        razorpayPaymentId: payId,
        razorpaySignature: signature,
      });
      expect(verified.order.paymentStatus).toBe("paid");
      expect(verified.payment.status).toBe("paid");

      await expect(
        verifyCustomerCheckoutPayment("00000000-0000-4000-8000-000000000099", {
          razorpayOrderId,
          razorpayPaymentId: payId,
          razorpaySignature: signature,
        }),
      ).rejects.toSatisfy((error) => error instanceof AppError && error.code === "ORDER_NOT_FOUND");

      await expect(
        verifyCustomerCheckoutPayment(ctx.userId, {
          razorpayOrderId,
          razorpayPaymentId: payId,
          razorpaySignature: "00",
        }),
      ).rejects.toSatisfy((error) => error instanceof AppError && error.status === 400);
    } finally {
      await cleanup(ctx);
    }
  }, 60_000);

  it("allows only one confirmInventorySale when webhook and verify race", async () => {
    const ctx = await setupUser();
    const payId = `pay_${crypto.randomUUID().slice(0, 8)}`;
    const mock = createMockPaymentProvider({ orderId: `order_${crypto.randomUUID().slice(0, 8)}` });
    setPaymentProviderForTests(mock);
    try {
      const session = await checkout(ctx.userId, {
        addressId: ctx.addressId,
        idempotencyKey: crypto.randomUUID(),
      });
      const razorpayOrderId = session.payment.razorpayOrderId!;
      setPaymentProviderForTests({
        createOrder: mock.createOrder.bind(mock),
        async fetchPayment() {
          return {
            id: payId,
            orderId: razorpayOrderId,
            amount: 10000,
            currency: "INR",
            status: "captured",
          };
        },
      });
      const raw = capturedBody(razorpayOrderId, payId, 10000);
      const webhookSignature = signWebhookBody(raw, process.env.RAZORPAY_WEBHOOK_SECRET!);
      const checkoutSignature = signCheckoutPayload(
        razorpayOrderId,
        payId,
        process.env.RAZORPAY_KEY_SECRET || KEY_SECRET,
      );

      await Promise.all([
        processRazorpayWebhook({ rawBody: raw, signature: webhookSignature }),
        verifyCustomerCheckoutPayment(ctx.userId, {
          razorpayOrderId,
          razorpayPaymentId: payId,
          razorpaySignature: checkoutSignature,
        }),
      ]);

      const sales = (await ctx.db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.variantId, ctx.variantId)))
        .filter((row) => row.transactionType === "sale");
      expect(sales).toHaveLength(1);
      const [stock] = await ctx.db.select().from(inventory).where(eq(inventory.variantId, ctx.variantId));
      expect(stock?.quantitySold).toBe(1);
    } finally {
      await cleanup(ctx);
    }
  }, 60_000);
});
