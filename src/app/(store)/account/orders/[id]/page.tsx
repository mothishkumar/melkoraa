import { notFound } from "next/navigation";

import { OrderDetailView } from "@/components/orders/order-detail-view";
import { requireAuth } from "@/lib/auth/require-auth";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { getCustomerOrder } from "@/server/services/orders/order-service";

export const metadata = {
  title: "Order",
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireAuth("/account/orders");
  const { id } = await params;
  let order;
  try {
    order = await getCustomerOrder(user.id, id);
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
      <p className="label-caps">{order.orderNumber}</p>
      <h1 className="editorial-display mt-4 text-4xl">{order.status}</h1>
      <div className="mt-12">
        <OrderDetailView order={order} />
      </div>
    </div>
  );
}
