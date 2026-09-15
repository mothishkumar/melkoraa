import { getDb } from "@/db";
import { cartLineAvailable } from "@/lib/cart/rules";
import { lineTotalMinor, minorToMoney, moneyToMinor, toMoneyString } from "@/lib/catalog/money";
import { logger } from "@/lib/logger";
import {
  CHECKOUT_PAYMENT_PROVIDER,
  generateOrderNumber,
  INVENTORY_REF_RESERVE,
} from "@/lib/orders/order-number";
import { isUniqueViolation } from "@/server/api";
import { conflictError, notFoundError, unprocessableError } from "@/server/errors";
import * as cartRepo from "@/server/repositories/cart/cart-repository";
import * as orderRepo from "@/server/repositories/orders/order-repository";
import type { OrderDb } from "@/server/repositories/orders/db";
import * as paymentRepo from "@/server/repositories/payments/payment-repository";
import { reserveInventory } from "@/server/services/inventory/inventory-service";
import { mapOrderDetail } from "@/server/services/orders/mappers";
import { attachRazorpayOrderForCheckout } from "@/server/services/payments/payment-service";
import type { OrderDetailDto } from "@/types/orders";
import type { CheckoutSessionDto } from "@/types/payments";

export type CheckoutInput = {
  addressId: string;
  idempotencyKey: string;
  billingAddressId?: string;
};

async function loadDetail(orderId: string, db?: OrderDb): Promise<OrderDetailDto> {
  const order = await orderRepo.findOrderById(orderId, db);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  const [items, payment] = await Promise.all([
    orderRepo.listOrderItems(orderId, db),
    paymentRepo.findPaymentForOrder(orderId, db),
  ]);
  return mapOrderDetail(order, items, payment);
}

async function prepareLines(userId: string, db?: OrderDb) {
  const lines = await cartRepo.listCartLines(userId, db);
  if (lines.length === 0) {
    throw unprocessableError("EMPTY_CART", "Your bag is empty.");
  }

  const prepared = [];
  for (const line of lines) {
    const variant = await cartRepo.findPurchasableVariant(line.variantId, db);
    if (!variant || variant.productStatus !== "active" || variant.isActive !== true) {
      throw unprocessableError(
        "CHECKOUT_UNAVAILABLE",
        "A product in your bag is no longer available.",
      );
    }
    const availableUnits = Number(variant.availableUnits);
    if (!cartLineAvailable(availableUnits, line.quantity)) {
      throw conflictError(
        "INSUFFICIENT_STOCK",
        "Not enough stock to check out. Update quantities in your bag.",
      );
    }
    const unitPrice = toMoneyString(variant.price);
    const unitPriceMinor = moneyToMinor(unitPrice);
    const lineMinor = lineTotalMinor(unitPriceMinor, line.quantity);
    prepared.push({
      variantId: variant.variantId,
      productId: variant.productId,
      productName: variant.productName,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: line.quantity,
      unitPrice,
      totalPrice: minorToMoney(lineMinor),
      lineMinor,
    });
  }

  const subtotalMinor = prepared.reduce((sum, line) => sum + line.lineMinor, 0);
  return {
    prepared,
    subtotal: minorToMoney(subtotalMinor),
    total: minorToMoney(subtotalMinor),
  };
}

async function createCheckoutOrder(
  userId: string,
  input: CheckoutInput,
  tx: OrderDb,
): Promise<OrderDetailDto> {
  const shipping = await orderRepo.findAddressForUser(userId, input.addressId, tx);
  if (!shipping) {
    throw notFoundError("ADDRESS_NOT_FOUND", "Shipping address was not found.");
  }
  const billingRow = input.billingAddressId
    ? await orderRepo.findAddressForUser(userId, input.billingAddressId, tx)
    : shipping;
  if (!billingRow) {
    throw notFoundError("ADDRESS_NOT_FOUND", "Billing address was not found.");
  }

  const { prepared, subtotal, total } = await prepareLines(userId, tx);
  const shippingSnap = orderRepo.snapshotAddress(shipping);
  const billingSnap = orderRepo.snapshotAddress(billingRow);

  let order = null;
  for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
    try {
      order = await orderRepo.insertOrder(
        {
          orderNumber: generateOrderNumber(),
          userId,
          status: "pending",
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
          subtotal,
          discountAmount: "0.00",
          shippingAmount: "0.00",
          taxAmount: "0.00",
          totalAmount: total,
          currency: "INR",
          shippingAddressSnapshot: shippingSnap,
          billingAddressSnapshot: billingSnap,
          idempotencyKey: input.idempotencyKey,
        },
        tx,
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await orderRepo.findOrderByIdempotency(
          userId,
          input.idempotencyKey,
          tx,
        );
        if (existing) {
          return loadDetail(existing.id, tx);
        }
        continue;
      }
      throw error;
    }
  }
  if (!order) {
    throw conflictError("ORDER_NUMBER_CONFLICT", "Could not allocate an order number.");
  }

  const items = await orderRepo.insertOrderItems(
    prepared.map((line) => ({
      orderId: order.id,
      productId: line.productId,
      variantId: line.variantId,
      productNameSnapshot: line.productName,
      skuSnapshot: line.sku,
      sizeSnapshot: line.size,
      colorSnapshot: line.color,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      totalPrice: line.totalPrice,
    })),
    tx,
  );

  for (const item of items) {
    if (!item.variantId) continue;
    await reserveInventory(
      item.variantId,
      item.quantity,
      {
        actorId: userId,
        referenceType: INVENTORY_REF_RESERVE,
        referenceId: item.id,
        notes: `Checkout ${order.orderNumber}`,
      },
      tx,
    );
  }

  await orderRepo.insertStatusHistory(
    {
      orderId: order.id,
      oldStatus: null,
      newStatus: "pending",
      changedBy: userId,
      notes: "Checkout created. Awaiting payment.",
    },
    tx,
  );

  await paymentRepo.insertPayment(
    {
      orderId: order.id,
      provider: CHECKOUT_PAYMENT_PROVIDER,
      amount: total,
      currency: "INR",
      status: "pending",
      metadata: { phase: "checkout" },
    },
    tx,
  );

  await cartRepo.convertActiveCart(userId, tx);
  logger.info("checkout.created", { resourceId: order.id, actorId: userId });
  return loadDetail(order.id, tx);
}

export async function checkout(userId: string, input: CheckoutInput): Promise<CheckoutSessionDto> {
  const existing = await orderRepo.findOrderByIdempotency(userId, input.idempotencyKey);
  if (existing) {
    return attachRazorpayOrderForCheckout(userId, existing.id);
  }

  const db = getDb();
  try {
    const created = await db.transaction(async (tx) => createCheckoutOrder(userId, input, tx));
    return attachRazorpayOrderForCheckout(userId, created.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      const replay = await orderRepo.findOrderByIdempotency(userId, input.idempotencyKey);
      if (replay) return attachRazorpayOrderForCheckout(userId, replay.id);
    }
    throw error;
  }
}
