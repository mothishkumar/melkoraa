export type AddressSnapshot = {
  name: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderItemDto = {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: string;
  unitPriceMinor: number;
  lineTotal: string;
  lineTotalMinor: number;
};

export type PaymentDto = {
  id: string;
  provider: string;
  status: string;
  amount: string;
  amountMinor: number;
  currency: string;
};

export type OrderSummaryDto = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  subtotal: string;
  subtotalMinor: number;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  totalAmountMinor: number;
  itemCount: number;
  createdAt: string;
};

export type OrderDetailDto = OrderSummaryDto & {
  items: OrderItemDto[];
  payment: PaymentDto | null;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
};
