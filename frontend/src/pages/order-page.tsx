import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { OrderDetailView } from "@/components/orders/order-detail-view";
import { paymentHeadline, paymentSuccessCopy, isVerifiedPaid } from "@/features/checkout/contract";
import { fetchOrder } from "@/lib/api/orders";
import type { OrderDetailDto } from "@/types/orders";

export function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    void fetchOrder(orderId)
      .then(setOrder)
      .catch(() => setError(true));
  }, [orderId]);

  if (error) {
    return <p className="store-light bg-[#f6f3ee] px-4 py-24 text-center text-[#111]">Order not found.</p>;
  }

  if (!order) {
    return <div className="store-light min-h-[40vh] bg-[#f6f3ee]" />;
  }

  return (
    <div className="store-light bg-[#f6f3ee] text-[#111]">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
        <p className="label-caps text-center">{order.orderNumber}</p>
        <h1 className="editorial-display mt-4 text-center text-4xl md:text-6xl">
          {paymentHeadline(order.paymentStatus, order.status)}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-center text-sm leading-7 text-[#6f6b66]">
          {paymentSuccessCopy(order.paymentStatus)}
        </p>
        {!isVerifiedPaid(order.paymentStatus) && order.paymentStatus === "pending" ? (
          <p className="mt-4 text-center text-sm text-[#6f6b66]">PAYMENT PROCESSING</p>
        ) : null}
        <div className="mt-12 border-t border-black/10 pt-10">
          <OrderDetailView order={order} />
        </div>
      </div>
    </div>
  );
}
