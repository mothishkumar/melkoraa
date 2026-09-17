import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { StatusPill } from "@/components/admin/status-pill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminOrdersRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { formatInr } from "@/lib/catalog/money";
import { orderListQuerySchema } from "@/lib/validation/checkout";
import type { AdminOrderSummary } from "@/types/admin";

export function OrdersPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = orderListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") || undefined,
    paymentStatus: searchParams.get("paymentStatus") || undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminOrdersRequest({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      paymentStatus: query.paymentStatus,
      sort: query.sort,
    })
      .then((result) => {
        if (!cancelled) {
          setOrders(result.data);
          setPage(result.pagination.page);
          setTotalPages(result.pagination.totalPages);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(userFacingApiMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick, searchParams]);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Orders" description="Staff can view all orders. Refunds and fulfillment are not implemented." />
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const next = new URLSearchParams();
          for (const [key, value] of form.entries()) {
            if (typeof value === "string" && value) next.set(key, value);
          }
          setSearchParams(next);
        }}
      >
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
          <option value="processing">processing</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
          <option value="returned">returned</option>
        </select>
        <select name="paymentStatus" defaultValue={query.paymentStatus ?? ""} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="">All payments</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
          <option value="authorized">authorized</option>
          <option value="refunded">refunded</option>
          <option value="partially_refunded">partially refunded</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="total_asc">Total ↑</option>
          <option value="total_desc">Total ↓</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <AdminEmpty title="No orders" description="No orders match these filters." />
      ) : (
        <div className="admin-panel overflow-x-auto">
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link to={`/orders/${order.id}`} className="hover:underline">{order.orderNumber}</Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="max-w-[8rem] truncate font-mono text-xs">{order.userId ?? "—"}</TableCell>
                  <TableCell><StatusPill value={order.status} /></TableCell>
                  <TableCell><StatusPill value={order.paymentStatus} /></TableCell>
                  <TableCell>{order.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(order.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/orders"
        params={{ search: query.search, status: query.status, paymentStatus: query.paymentStatus, sort: query.sort }}
      />
    </div>
  );
}
