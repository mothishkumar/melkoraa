import { orderItems, orders, payments } from "@/db/schema";
import { lineTotalMinor, minorToMoney, moneyToMinor, toMoneyString } from "@/lib/catalog/money";
import type {
  AddressSnapshot,
  OrderDetailDto,
  OrderItemDto,
  OrderSummaryDto,
  PaymentDto,
} from "@/types/orders";

export function mapOrderItem(row: typeof orderItems.$inferSelect): OrderItemDto {
  const unitPrice = toMoneyString(row.unitPrice);
  const unitPriceMinor = moneyToMinor(unitPrice);
  const lineMinor = lineTotalMinor(unitPriceMinor, row.quantity);
  return {
    id: row.id,
    productId: row.productId,
    variantId: row.variantId,
    productName: row.productNameSnapshot,
    sku: row.skuSnapshot,
    size: row.sizeSnapshot,
    color: row.colorSnapshot,
    quantity: row.quantity,
    unitPrice,
    unitPriceMinor,
    lineTotal: minorToMoney(lineMinor),
    lineTotalMinor: lineMinor,
  };
}

export function mapPayment(row: typeof payments.$inferSelect): PaymentDto {
  const amount = toMoneyString(row.amount);
  return {
    id: row.id,
    provider: row.provider,
    status: row.status,
    amount,
    amountMinor: moneyToMinor(amount),
    currency: row.currency,
  };
}

export function mapOrderSummary(
  row: typeof orders.$inferSelect,
  items: typeof orderItems.$inferSelect[],
): OrderSummaryDto {
  const subtotal = toMoneyString(row.subtotal);
  const total = toMoneyString(row.totalAmount);
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    currency: row.currency,
    subtotal,
    subtotalMinor: moneyToMinor(subtotal),
    discountAmount: toMoneyString(row.discountAmount),
    shippingAmount: toMoneyString(row.shippingAmount),
    taxAmount: toMoneyString(row.taxAmount),
    totalAmount: total,
    totalAmountMinor: moneyToMinor(total),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapOrderDetail(
  row: typeof orders.$inferSelect,
  items: typeof orderItems.$inferSelect[],
  payment: typeof payments.$inferSelect | null,
): OrderDetailDto {
  return {
    ...mapOrderSummary(row, items),
    items: items.map(mapOrderItem),
    payment: payment ? mapPayment(payment) : null,
    shippingAddress: row.shippingAddressSnapshot as AddressSnapshot,
    billingAddress: row.billingAddressSnapshot as AddressSnapshot,
  };
}
