import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/catalog/money";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { requireStaff } from "@/lib/auth/require-role";
import { getAdminOrder } from "@/server/services/orders/order-service";

export const metadata = { title: "Order" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  let order;
  try {
    order = await getAdminOrder(id);
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <AdminPageHeader
        title={order.orderNumber}
        description={`${new Date(order.createdAt).toLocaleString("en-IN")} · customer ${order.userId ?? "unknown"}`}
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{order.status}</Badge>
        <Badge variant="outline">payment {order.paymentStatus}</Badge>
        <Badge variant="outline">{order.fulfillmentStatus}</Badge>
      </div>
      <section>
        <h2 className="mb-3 text-sm font-medium">Items</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Line</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.productName}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.sku} · {item.size} / {item.color}
                    </span>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatInr(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-right text-sm">Total {formatInr(order.totalAmount)}</p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium">Ship to</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {order.shippingAddress.name}
            <br />
            {order.shippingAddress.addressLine1}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium">Payment</h2>
          {order.payment ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {order.payment.provider} · {order.payment.status}
              <br />
              {formatInr(order.payment.amount)} {order.payment.currency}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No payment row.</p>
          )}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">History</h2>
        {order.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status history rows.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {order.history.map((entry) => (
              <li key={entry.id}>
                {new Date(entry.createdAt).toLocaleString("en-IN")} · {entry.oldStatus ?? "—"} → {entry.newStatus}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
