import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
import * as orderRepo from "@/server/repositories/orders/order-repository";
import { checkout } from "@/server/services/checkout/checkout-service";
import { cancelCustomerOrder } from "@/server/services/orders/order-service";
import { isUniqueViolation } from "@/server/api";
import {
  createMockPaymentProvider,
  setPaymentProviderForTests,
} from "@/server/payments/razorpay";

function ensureDatabaseUrl(): string {
  loadProjectEnv();
  try {
    const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const entry of envFile.split(/\r?\n/)) {
      if (!entry || entry.startsWith("#") || !entry.includes("=")) continue;
      const eq = entry.indexOf("=");
      const key = entry.slice(0, eq).trim();
      let value = entry.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local is optional when the process already has env.
  }
  return process.env.DATABASE_URL ?? "";
}

const databaseUrl = ensureDatabaseUrl();
loadProjectEnv();
const canRun =
  databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
const canRunAuthCheckout = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

describe.skipIf(!canRun)("checkout database operations", () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  const slug = `phase7-ord-${crypto.randomUUID()}`;
  let productId = "";
  let variantId = "";
  let cartId = "";

  beforeAll(async () => {
    const url = requirePostgresConnectionString(process.env.DATABASE_URL, "DATABASE_URL");
    client = postgres(url, runtimePostgresOptions);
    db = drizzle(client, { schema });

    const [product] = await db
      .insert(products)
      .values({
        name: "Phase 7 Order Fixture",
        slug,
        status: "active",
        basePrice: "100.00",
      })
      .returning({ id: products.id });
    productId = product!.id;

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: `P7-${crypto.randomUUID().slice(0, 8)}`,
        size: "M",
        color: "Black",
        price: "250.00",
      })
      .returning({ id: productVariants.id });
    variantId = variant!.id;

    await db.insert(inventory).values({
      variantId,
      quantityOnHand: 2,
      quantityReserved: 0,
      quantitySold: 0,
    });

    const [cart] = await db
      .insert(carts)
      .values({ sessionId: `phase7-${crypto.randomUUID()}`, status: "active" })
      .returning({ id: carts.id });
    cartId = cart!.id;
  });

  afterAll(async () => {
    try {
      if (cartId) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
        await db.delete(carts).where(eq(carts.id, cartId));
      }
      if (variantId) {
        await db.delete(inventoryTransactions).where(eq(inventoryTransactions.variantId, variantId));
        await db.delete(inventory).where(eq(inventory.variantId, variantId));
        await db.delete(productVariants).where(eq(productVariants.id, variantId));
      }
      if (productId) {
        await db.delete(products).where(eq(products.id, productId));
      }
    } finally {
      await client.end();
    }
  });

  it("rejects a second ledger row with the same reference_type and reference_id", async () => {
    const referenceId = crypto.randomUUID();
    await db.insert(inventoryTransactions).values({
      variantId,
      transactionType: "reservation",
      quantity: 1,
      referenceType: "order_item",
      referenceId,
    });
    await expect(
      db.insert(inventoryTransactions).values({
        variantId,
        transactionType: "reservation",
        quantity: 1,
        referenceType: "order_item",
        referenceId,
      }),
    ).rejects.toSatisfy((error) => isUniqueViolation(error));
    await db
      .delete(inventoryTransactions)
      .where(eq(inventoryTransactions.referenceId, referenceId));
  });

  it("does not use cart.unit_price when a live variant price exists", async () => {
    await cartRepo.upsertCartItemQuantity(cartId, variantId, 1, "1.00", db);
    const [variant] = await db
      .select({ price: productVariants.price })
      .from(productVariants)
      .where(eq(productVariants.id, variantId));
    const [item] = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    expect(item?.unitPrice).toBe("1.00");
    expect(variant?.price).toBe("250.00");
    expect(variant?.price).not.toBe(item?.unitPrice);
  });

  it("order lookup by another user id returns nothing", async () => {
    const found = await orderRepo.findOrderForUser(
      "00000000-0000-4000-8000-000000000099",
      "00000000-0000-4000-8000-000000000098",
      db,
    );
    expect(found).toBeNull();
  });
});

describe.skipIf(!canRunAuthCheckout)("checkout with auth users", () => {
  it("creates one order for sequential identical idempotency keys", async () => {
    loadProjectEnv();
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = `phase7-${Date.now()}@melkoraa.test`;
    const password = "Phase7Test!ok";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Phase 7" },
    });
    if (error || !data.user) {
      throw error ?? new Error("createUser failed");
    }
    const userId = data.user.id;
    const dbUrl = requirePostgresConnectionString(process.env.DATABASE_URL, "DATABASE_URL");
    const sql = postgres(dbUrl, runtimePostgresOptions);
    const db = drizzle(sql, { schema });
    let variantId = "";
    let productId = "";
    try {
      await new Promise((r) => setTimeout(r, 400));
      const [address] = await db
        .insert(addresses)
        .values({
          userId,
          name: "Phase 7",
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
          name: "Phase 7 Live Fixture",
          slug: `phase7-live-${crypto.randomUUID()}`,
          status: "active",
          basePrice: "100.00",
        })
        .returning();
      productId = product!.id;
      const [variant] = await db
        .insert(productVariants)
        .values({
          productId,
          sku: `P7L-${crypto.randomUUID().slice(0, 8)}`,
          size: "M",
          color: "Black",
          price: "100.00",
        })
        .returning();
      variantId = variant!.id;
      await db.insert(inventory).values({
        variantId,
        quantityOnHand: 5,
        quantityReserved: 0,
        quantitySold: 0,
      });
      await db.insert(carts).values({ userId, status: "active" });
      const cart = await cartRepo.findActiveCartByUserId(userId, db);
      await cartRepo.upsertCartItemQuantity(cart!.id, variantId, 1, "999.00", db);

      const idempotencyKey = crypto.randomUUID();
      const input = { addressId: address!.id, idempotencyKey };
      process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
      process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_key_secret_placeholder";
      process.env.RAZORPAY_WEBHOOK_SECRET =
        process.env.RAZORPAY_WEBHOOK_SECRET || "test_webhook_secret_placeholder";
      const mock = createMockPaymentProvider();
      setPaymentProviderForTests(mock);
      const first = await checkout(userId, input);
      const second = await checkout(userId, input);
      expect(first.order.id).toBe(second.order.id);
      expect(first.order.orderNumber).toBe(second.order.orderNumber);
      expect(first.order.paymentStatus).toBe("pending");
      expect(first.order.status).toBe("pending");
      expect(first.payment.provider).toBe("razorpay");
      expect(first.payment.razorpayOrderId).toBeTruthy();
      expect(first.payment.keyId).toBeTruthy();
      expect(first.payment.amountMinor).toBe(10000);
      expect(first.payment.currency).toBe("INR");
      expect(mock.created).toHaveLength(1);
      expect(mock.created[0]?.amount).toBe(10000);
      expect(JSON.stringify(first)).not.toContain("onHand");
      expect(JSON.stringify(first)).not.toContain("RAZORPAY_KEY_SECRET");
      expect(JSON.stringify(first)).not.toContain("test_key_secret_placeholder");

      const [stock] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.variantId, variantId));
      expect(stock?.quantityReserved).toBe(1);
      expect(stock?.quantityOnHand).toBe(5);
      expect(stock?.quantitySold).toBe(0);

      const activeCart = await cartRepo.findActiveCartByUserId(userId, db);
      expect(activeCart).toBeNull();

      const [payment] = await db.select().from(payments).where(eq(payments.orderId, first.order.id));
      expect(payment?.status).toBe("pending");
      expect(payment?.providerOrderId).toBe(first.payment.razorpayOrderId);

      const cancelled = await cancelCustomerOrder(userId, first.order.id);
      expect(cancelled.status).toBe("cancelled");
      const [after] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.variantId, variantId));
      expect(after?.quantityReserved).toBe(0);

      await expect(cancelCustomerOrder(userId, first.order.id)).rejects.toBeTruthy();
    } finally {
      setPaymentProviderForTests(null);
      if (variantId) {
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
      }
      if (productId) await db.delete(products).where(eq(products.id, productId));
      const userCarts = await db.select().from(carts).where(eq(carts.userId, userId));
      for (const cart of userCarts) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
      await db.delete(carts).where(eq(carts.userId, userId));
      await db.delete(addresses).where(eq(addresses.userId, userId));
      await sql.end({ timeout: 0 });
      await admin.auth.admin.deleteUser(userId);
    }
  }, 45_000);
});
