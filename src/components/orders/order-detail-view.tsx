import { formatInr } from "@/lib/catalog/money";
import { canCancelUnpaid } from "@/server/services/orders/order-service";
import type { OrderDetailDto } from "@/types/orders";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";

export function OrderDetailView({ order }: { order: OrderDetailDto }) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-stone">
        {new Date(order.createdAt).toLocaleString("en-IN")} · {order.status} · payment{" "}
        {order.paymentStatus}
      </p>
      <ul className="space-y-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span>
              {item.productName}
              <span className="mt-1 block text-stone">
                {item.size} / {item.color} · {item.quantity}
              </span>
            </span>
            <span>{formatInr(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-white/10 pt-4 text-sm">
        <span>Total</span>
        <span>{formatInr(order.totalAmount)}</span>
      </p>
      <div className="text-sm leading-7 text-stone">
        <p className="label-caps text-off-white">Ship to</p>
        <p className="mt-3">
          {order.shippingAddress.name}
          <br />
          {order.shippingAddress.addressLine1}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.postalCode}
        </p>
      </div>
      {canCancelUnpaid(order.status, order.paymentStatus) ? (
        <CancelOrderButton orderId={order.id} />
      ) : null}
    </div>
  );
}
