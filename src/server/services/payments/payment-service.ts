import { getDb } from "@/db";
import { moneyToMinor, toMoneyString } from "@/lib/catalog/money";
import { logger } from "@/lib/logger";
import { CHECKOUT_PAYMENT_PROVIDER, INVENTORY_REF_RELEASE, INVENTORY_REF_SALE } from "@/lib/orders/order-number";
import {
  conflictError,
  notFoundError,
  serviceUnavailableError,
  validationError,
} from "@/server/errors";
import {
  getPaymentProvider,
  getRazorpayKeySecret,
  getRazorpayPublicKeyId,
  getRazorpayWebhookSecret,
  isRazorpayConfigured,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "@/server/payments/razorpay";
import type { OrderDb } from "@/server/repositories/orders/db";
import * as orderRepo from "@/server/repositories/orders/order-repository";
import * as paymentRepo from "@/server/repositories/payments/payment-repository";
import { confirmInventorySale, releaseInventory } from "@/server/services/inventory/inventory-service";
import { razorpayWebhookBodySchema } from "@/lib/validation/payments";
import type { CheckoutSessionDto, PaymentFinalizeResult } from "@/types/payments";

const SUPPORTED_SUCCESS_EVENT = "payment.captured";
const SUPPORTED_FAILURE_EVENT = "payment.failed";

function toCheckoutSession(
  order: NonNullable<Awaited<ReturnType<typeof orderRepo.findOrderById>>>,
  payment: NonNullable<Awaited<ReturnType<typeof paymentRepo.findPaymentForOrder>>>,
): CheckoutSessionDto {
  const amount = toMoneyString(payment.amount);
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: toMoneyString(order.totalAmount),
      totalAmountMinor: moneyToMinor(toMoneyString(order.totalAmount)),
      currency: order.currency,
    },
    payment: {
      provider: "razorpay",
      status: payment.status,
      razorpayOrderId: payment.providerOrderId,
      keyId: getRazorpayPublicKeyId(),
      amountMinor: moneyToMinor(amount),
      currency: payment.currency,
    },
  };
}

async function loadCheckoutSession(orderId: string): Promise<CheckoutSessionDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  const payment = await paymentRepo.findPaymentForOrder(orderId);
  if (!payment) {
    throw notFoundError("PAYMENT_NOT_FOUND", "Payment was not found for this order.");
  }
  return toCheckoutSession(order, payment);
}

export async function failUnpaidOrder(
  orderId: string,
  actorId: string | null,
  notes: string,
  db?: OrderDb,
): Promise<{ applied: boolean; reason?: string }> {
  const apply = async (tx: OrderDb) => {
    const order = await orderRepo.findOrderById(orderId, tx);
    if (!order) {
      return { applied: false, reason: "not_found" };
    }
    if (order.status === "confirmed" || order.paymentStatus === "paid") {
      return { applied: false, reason: "already_paid" };
    }
    if (order.status === "cancelled") {
      return { applied: false, reason: "already_cancelled" };
    }
    if (order.status !== "pending" || order.paymentStatus !== "pending") {
      return { applied: false, reason: "not_pending" };
    }

    const payment = await paymentRepo.findPaymentForOrder(order.id, tx);
    if (payment) {
      const cas = await paymentRepo.casTransitionPayment(payment.id, "pending", "failed", undefined, tx);
      if (!cas) {
        const latest = await paymentRepo.findPaymentForOrder(order.id, tx);
        if (latest?.status === "paid") {
          return { applied: false, reason: "already_paid" };
        }
        return { applied: false, reason: "already_failed" };
      }
    }

    const items = await orderRepo.listOrderItems(order.id, tx);
    for (const item of items) {
      if (!item.variantId) continue;
      await releaseInventory(
        item.variantId,
        item.quantity,
        {
          actorId: actorId ?? order.userId ?? order.id,
          referenceType: INVENTORY_REF_RELEASE,
          referenceId: item.id,
          notes,
        },
        tx,
      );
    }

    await orderRepo.updateOrderStatus(order.id, "cancelled", tx, "failed");
    await orderRepo.insertStatusHistory(
      {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: "cancelled",
        changedBy: actorId,
        notes,
      },
      tx,
    );
    return { applied: true };
  };

  return db ? apply(db) : getDb().transaction(apply);
}

async function confirmSaleForOrder(
  orderId: string,
  actorId: string | null,
  notes: string,
  tx: OrderDb,
) {
  const items = await orderRepo.listOrderItems(orderId, tx);
  for (const item of items) {
    if (!item.variantId) continue;
    await confirmInventorySale(
      item.variantId,
      item.quantity,
      {
        actorId: actorId ?? orderId,
        referenceType: INVENTORY_REF_SALE,
        referenceId: item.id,
        notes,
      },
      tx,
    );
  }
}

async function finalizePaidInTx(
  input: {
    providerEventId: string;
    eventType: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    amountPaise: number;
    currency: string;
    actorId: string | null;
  },
  tx: OrderDb,
): Promise<PaymentFinalizeResult> {
  const payment = await paymentRepo.findPaymentByProviderOrderId(
    CHECKOUT_PAYMENT_PROVIDER,
    input.razorpayOrderId,
    tx,
    { forUpdate: true },
  );
  if (!payment) {
    throw notFoundError("PAYMENT_NOT_FOUND", "Payment was not found.");
  }

  const expectedPaise = moneyToMinor(toMoneyString(payment.amount));
  if (input.amountPaise !== expectedPaise || input.currency.toUpperCase() !== payment.currency.toUpperCase()) {
    throw conflictError("PAYMENT_MISMATCH", "Payment details do not match this order.");
  }

  const eventRow = await paymentRepo.insertPaymentEventIfNew(
    {
      provider: CHECKOUT_PAYMENT_PROVIDER,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      paymentId: payment.id,
    },
    tx,
  );
  if (!eventRow) {
    const order = await orderRepo.findOrderById(payment.orderId, tx);
    return {
      orderId: payment.orderId,
      paymentStatus: payment.status,
      orderStatus: order?.status ?? "pending",
      alreadyFinalized: true,
    };
  }

  const fresh = await paymentRepo.findPaymentForOrder(payment.orderId, tx);
  if (!fresh) {
    throw notFoundError("PAYMENT_NOT_FOUND", "Payment was not found.");
  }
  if (fresh.status === "paid") {
    const order = await orderRepo.findOrderById(payment.orderId, tx);
    return {
      orderId: payment.orderId,
      paymentStatus: "paid",
      orderStatus: order?.status ?? "confirmed",
      alreadyFinalized: true,
    };
  }
  if (fresh.status !== "pending") {
    throw conflictError("PAYMENT_NOT_PENDING", "This payment can no longer be marked paid.");
  }

  const cas = await paymentRepo.casTransitionPayment(
    fresh.id,
    "pending",
    "paid",
    { providerPaymentId: input.razorpayPaymentId },
    tx,
  );
  if (!cas) {
    const latest = await paymentRepo.findPaymentForOrder(payment.orderId, tx);
    if (latest?.status === "paid") {
      const order = await orderRepo.findOrderById(payment.orderId, tx);
      return {
        orderId: payment.orderId,
        paymentStatus: "paid",
        orderStatus: order?.status ?? "confirmed",
        alreadyFinalized: true,
      };
    }
    throw conflictError("PAYMENT_NOT_PENDING", "This payment can no longer be marked paid.");
  }

  const order = await orderRepo.findOrderById(payment.orderId, tx);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  if (order.status === "pending") {
    await orderRepo.updateOrderStatus(order.id, "confirmed", tx, "paid");
    await orderRepo.insertStatusHistory(
      {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: "confirmed",
        changedBy: input.actorId,
        notes: "Razorpay payment captured. Inventory sale confirmed.",
      },
      tx,
    );
  }

  await confirmSaleForOrder(order.id, input.actorId, `Sale ${order.orderNumber}`, tx);
  logger.info("payment.paid", {
    resourceId: order.id,
    providerOrderId: input.razorpayOrderId,
    providerPaymentId: input.razorpayPaymentId,
  });
  return {
    orderId: order.id,
    paymentStatus: "paid",
    orderStatus: "confirmed",
    alreadyFinalized: false,
  };
}

export async function finalizePaidPayment(input: {
  providerEventId: string;
  eventType: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  actorId: string | null;
}): Promise<PaymentFinalizeResult> {
  return getDb().transaction((tx) => finalizePaidInTx(input, tx));
}

async function finalizeFailedInTx(
  input: {
    providerEventId: string;
    eventType: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    actorId: string | null;
  },
  tx: OrderDb,
): Promise<PaymentFinalizeResult> {
  const payment = await paymentRepo.findPaymentByProviderOrderId(
    CHECKOUT_PAYMENT_PROVIDER,
    input.razorpayOrderId,
    tx,
    { forUpdate: true },
  );
  if (!payment) {
    throw notFoundError("PAYMENT_NOT_FOUND", "Payment was not found.");
  }

  const eventRow = await paymentRepo.insertPaymentEventIfNew(
    {
      provider: CHECKOUT_PAYMENT_PROVIDER,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      paymentId: payment.id,
    },
    tx,
  );
  if (!eventRow) {
    const order = await orderRepo.findOrderById(payment.orderId, tx);
    return {
      orderId: payment.orderId,
      paymentStatus: payment.status,
      orderStatus: order?.status ?? "pending",
      alreadyFinalized: true,
    };
  }

  if (payment.status === "paid") {
    const order = await orderRepo.findOrderById(payment.orderId, tx);
    logger.info("payment.failed_ignored_paid", {
      resourceId: payment.orderId,
      providerOrderId: input.razorpayOrderId,
    });
    return {
      orderId: payment.orderId,
      paymentStatus: "paid",
      orderStatus: order?.status ?? "confirmed",
      alreadyFinalized: true,
    };
  }

  const failed = await failUnpaidOrder(
    payment.orderId,
    input.actorId,
    "Razorpay payment failed. Reservation released.",
    tx,
  );
  const order = await orderRepo.findOrderById(payment.orderId, tx);
  logger.info("payment.failed", {
    resourceId: payment.orderId,
    providerOrderId: input.razorpayOrderId,
    applied: failed.applied,
  });
  return {
    orderId: payment.orderId,
    paymentStatus: order?.paymentStatus ?? "failed",
    orderStatus: order?.status ?? "cancelled",
    alreadyFinalized: !failed.applied,
  };
}

export async function attachRazorpayOrderForCheckout(
  userId: string,
  orderId: string,
): Promise<CheckoutSessionDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }
  if (order.userId && order.userId !== userId) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }

  const payment = await paymentRepo.findPaymentForOrder(orderId);
  if (!payment) {
    throw notFoundError("PAYMENT_NOT_FOUND", "Payment was not found for this order.");
  }

  if (payment.providerOrderId || payment.status !== "pending" || order.status !== "pending") {
    return toCheckoutSession(order, payment);
  }

  const amountPaise = moneyToMinor(toMoneyString(order.totalAmount));
  if (amountPaise !== moneyToMinor(toMoneyString(payment.amount))) {
    await failUnpaidOrder(order.id, userId, "Internal payment amount mismatch.");
    throw conflictError("PAYMENT_MISMATCH", "Payment could not be started.");
  }

  if (!isRazorpayConfigured()) {
    await failUnpaidOrder(order.id, userId, "Payment provider is not configured.");
    throw serviceUnavailableError("PAYMENT_UNAVAILABLE", "Payments are temporarily unavailable.");
  }

  let created;
  try {
    created = await getPaymentProvider().createOrder({
      amountPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: { melkoraaOrderId: order.id },
    });
  } catch {
    logger.error("razorpay.create_order_failed", { resourceId: order.id });
    await failUnpaidOrder(order.id, userId, "Razorpay order creation failed.");
    throw serviceUnavailableError("PAYMENT_PROVIDER_FAILED", "Payment could not be started.");
  }

  if (created.amount !== amountPaise || created.currency.toUpperCase() !== "INR") {
    await failUnpaidOrder(order.id, userId, "Razorpay order amount mismatch.");
    throw conflictError("PAYMENT_MISMATCH", "Payment could not be started.");
  }

  const attached = await paymentRepo.attachProviderOrderId(payment.id, created.id);
  if (!attached) {
    const latest = await paymentRepo.findPaymentForOrder(order.id);
    if (latest?.providerOrderId) {
      return loadCheckoutSession(order.id);
    }
    await failUnpaidOrder(order.id, userId, "Could not attach Razorpay order.");
    throw serviceUnavailableError("PAYMENT_PROVIDER_FAILED", "Payment could not be started.");
  }

  logger.info("razorpay.order_attached", {
    resourceId: order.id,
    providerOrderId: created.id,
  });
  return loadCheckoutSession(order.id);
}

export async function processRazorpayWebhook(input: { rawBody: string; signature: string }) {
  const secret = getRazorpayWebhookSecret();
  if (!secret) {
    throw serviceUnavailableError("PAYMENT_UNAVAILABLE", "Payments are temporarily unavailable.");
  }
  if (!verifyWebhookSignature(input.rawBody, input.signature, secret)) {
    throw validationError("Invalid webhook signature.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.rawBody) as unknown;
  } catch {
    throw validationError("Invalid webhook payload.");
  }

  const body = razorpayWebhookBodySchema.parse(parsed);
  if (body.event !== SUPPORTED_SUCCESS_EVENT && body.event !== SUPPORTED_FAILURE_EVENT) {
    logger.info("razorpay.webhook_ignored", { eventType: body.event });
    return { received: true, event: body.event, action: "ignored" as const };
  }

  const entity = body.payload.payment?.entity;
  if (!entity) {
    throw validationError("Invalid webhook payload.");
  }

  if (body.event === SUPPORTED_SUCCESS_EVENT) {
    const result = await finalizePaidPayment({
      providerEventId: `${body.event}:${entity.id}`,
      eventType: body.event,
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
      amountPaise: entity.amount,
      currency: entity.currency,
      actorId: null,
    });
    return { received: true, event: body.event, action: "paid" as const, alreadyFinalized: result.alreadyFinalized };
  }

  const result = await getDb().transaction((tx) =>
    finalizeFailedInTx(
      {
        providerEventId: `${body.event}:${entity.id}`,
        eventType: body.event,
        razorpayOrderId: entity.order_id,
        razorpayPaymentId: entity.id,
        actorId: null,
      },
      tx,
    ),
  );
  return { received: true, event: body.event, action: "failed" as const, alreadyFinalized: result.alreadyFinalized };
}

export async function verifyCustomerCheckoutPayment(
  userId: string,
  input: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string },
) {
  const keySecret = getRazorpayKeySecret();
  if (!keySecret) {
    throw serviceUnavailableError("PAYMENT_UNAVAILABLE", "Payments are temporarily unavailable.");
  }
  if (
    !verifyCheckoutSignature({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      keySecret,
    })
  ) {
    throw validationError("Payment verification failed.");
  }

  const payment = await paymentRepo.findPaymentByProviderOrderId(
    CHECKOUT_PAYMENT_PROVIDER,
    input.razorpayOrderId,
  );
  if (!payment) {
    throw notFoundError("PAYMENT_NOT_FOUND", "Payment was not found.");
  }
  const order = await orderRepo.findOrderForUser(userId, payment.orderId);
  if (!order) {
    throw notFoundError("ORDER_NOT_FOUND", "Order not found.");
  }

  const remote = await getPaymentProvider().fetchPayment(input.razorpayPaymentId);
  if (remote.orderId !== input.razorpayOrderId || remote.id !== input.razorpayPaymentId) {
    throw conflictError("PAYMENT_MISMATCH", "Payment details do not match this order.");
  }

  const result = await finalizePaidPayment({
    providerEventId: `checkout.verify:${input.razorpayPaymentId}`,
    eventType: "checkout.verify",
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    amountPaise: remote.amount,
    currency: remote.currency,
    actorId: userId,
  });

  const session = await loadCheckoutSession(order.id);
  return { ...session, alreadyFinalized: result.alreadyFinalized };
}

export { loadCheckoutSession };
