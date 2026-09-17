import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
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
import { listAdminCustomersRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminCustomerQuerySchema } from "@/lib/validation/admin";
import type { AdminCustomer } from "@/types/admin";

export function CustomersPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = adminCustomerQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminCustomersRequest({ page: query.page, pageSize: query.pageSize, search: query.search, sort: query.sort })
      .then((result) => {
        if (!cancelled) {
          setCustomers(result.data);
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
      <AdminPageHeader
        title="Customers"
        description="Profile records for customer-role accounts. Passwords, tokens, and auth internals are not exposed."
      />
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
          placeholder="Search name or phone"
          className="h-8 min-w-[12rem] flex-1 border border-input bg-transparent px-2 text-sm"
        />
        <select name="sort" defaultValue={query.sort} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading customers…</p>
      ) : customers.length === 0 ? (
        <AdminEmpty title="No customers" description="No customer profiles match these filters." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.userId}>
                  <TableCell>
                    {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="max-w-[14rem] truncate">{customer.email ?? "—"}</TableCell>
                  <TableCell>{customer.phone ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{customer.orderCount}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(customer.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination page={page} totalPages={totalPages} basePath="/customers" params={{ search: query.search, sort: query.sort }} />
    </div>
  );
}
