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
import { requireStaff } from "@/lib/auth/require-role";
import { adminCustomerQuerySchema } from "@/lib/validation/admin";
import { listAdminCustomers } from "@/server/services/customers/customer-service";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage({
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
  const query = adminCustomerQuerySchema.parse({
    page: flat.page,
    pageSize: flat.pageSize,
    search: flat.search,
  });
  const result = await listAdminCustomers(query);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Customers"
        description="Profile records for customer-role accounts. Passwords, tokens, and auth internals are not exposed. Role changes are not available."
      />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="search"
          defaultValue={query.search ?? ""}
          placeholder="Search name or phone"
          className="h-8 min-w-[12rem] flex-1 border border-input bg-transparent px-2 text-sm"
        />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {result.data.length === 0 ? (
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
              {result.data.map((customer) => (
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
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/customers"
        params={{ search: query.search }}
      />
    </div>
  );
}
