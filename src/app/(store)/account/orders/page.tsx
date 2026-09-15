import Link from "next/link";

import { requireAuth } from "@/lib/auth/require-auth";
import { formatInr } from "@/lib/catalog/money";
import { listCustomerOrders } from "@/server/services/orders/order-service";

export const metadata = {
  title: "Orders",
};

export default async function AccountOrdersPage() {
  const { user } = await requireAuth("/account/orders");
  const result = await listCustomerOrders(user.id, 1, 50);

  if (result.data.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-24 text-center md:px-8">
        <p className="editorial-display text-4xl">NO ORDERS YET.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex border border-off-white px-8 py-4 text-[0.7rem] tracking-[0.28em] uppercase"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
      <p className="label-caps">Orders</p>
      <h1 className="editorial-display mt-4 text-4xl">History</h1>
      <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
        {result.data.map((order) => (
          <li key={order.id} className="py-6">
            <Link href={`/account/orders/${order.id}`} className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <span className="text-sm tracking-[0.12em] uppercase">{order.orderNumber}</span>
              <span className="text-sm text-stone">
                {new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.status} ·{" "}
                {order.paymentStatus} · {formatInr(order.totalAmount)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
