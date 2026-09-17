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
import { listAdminPaymentsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminPaymentQuerySchema } from "@/lib/validation/admin";
import { formatInr } from "@/lib/catalog/money";
import type { AdminPayment } from "@/types/admin";

export function PaymentsPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = adminPaymentQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    provider: searchParams.get("provider") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminPaymentsRequest(query)
      .then((result) => {
        if (!cancelled) {
          setPayments(result.data);
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
  }, [searchParams, tick]);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Payments"
        description="Read-only payment records. Provider secrets, signatures, and payment metadata are never exposed."
      />
      <form
        className="admin-panel mb-4 flex flex-wrap gap-2 p-3"
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
          placeholder="Search order or provider order ID"
          className="h-9 min-w-[13rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <input
          name="provider"
          defaultValue={query.provider ?? ""}
          placeholder="Provider"
          className="h-9 w-28 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <select name="status" defaultValue={query.status ?? ""} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="authorized">authorized</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
          <option value="refunded">refunded</option>
          <option value="partially_refunded">partially refunded</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount_asc">Amount ↑</option>
          <option value="amount_desc">Amount ↓</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : payments.length === 0 ? (
        <AdminEmpty title="No payment records" description="No payment records match these filters." />
      ) : (
        <div className="admin-panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link to={`/orders/${payment.orderId}`} className="font-medium hover:underline">
                      {payment.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{payment.provider}</TableCell>
                  <TableCell><StatusPill value={payment.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(payment.amount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(payment.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/payments"
        params={{
          search: query.search,
          provider: query.provider,
          status: query.status,
          sort: query.sort,
        }}
      />
    </div>
  );
}
