import { paymentHeadline, paymentSuccessCopy, isVerifiedPaid } from "@/features/checkout/contract";
import { requireAuth } from "@/lib/auth/require-auth";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { getCustomerOrder } from "@/server/services/orders/order-service";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Order",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { user } = await requireAuth("/account/orders");
  const { orderId } = await params;
  let order;
  try {
    order = await getCustomerOrder(user.id, orderId);
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!order) notFound();

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
