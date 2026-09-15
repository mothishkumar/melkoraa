import Link from "next/link";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/catalog/money";
import { requireStaff } from "@/lib/auth/require-role";
import { orderListQuerySchema } from "@/lib/validation/checkout";
import { listAdminOrders } from "@/server/services/orders/order-service";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const raw = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const query = orderListQuerySchema.parse({
    ...flat,
    status: flat.status || undefined,
    paymentStatus: flat.paymentStatus || undefined,
  });
  const result = await listAdminOrders(query.page, query.pageSize, {
    status: query.status,
    paymentStatus: query.paymentStatus,
    search: query.search,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Orders" description="Staff can view all orders. Refunds and fulfillment are not implemented." />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="search"
          defaultValue={query.search ?? ""}
          placeholder="Order number"
          className="h-8 min-w-[10rem] flex-1 border border-input bg-transparent px-2 text-sm"
        />
        <select name="status" defaultValue={query.status ?? ""} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select
          name="paymentStatus"
          defaultValue={query.paymentStatus ?? ""}
          className="h-8 border border-input bg-transparent px-2 text-sm"
        >
          <option value="">All payments</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {result.data.length === 0 ? (
        <AdminEmpty title="No orders" description="No orders match these filters." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="max-w-[8rem] truncate font-mono text-xs">
                    {order.userId ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell>{order.paymentStatus}</TableCell>
                  <TableCell>{order.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(order.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/orders"
        params={{ search: query.search, status: query.status, paymentStatus: query.paymentStatus }}
      />
    </div>
  );
}
