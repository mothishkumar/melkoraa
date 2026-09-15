import Link from "next/link";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { ProductTable } from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
import { isManager } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/require-role";
import { adminProductQuerySchema } from "@/lib/validation/catalog";
import { listAdminProducts } from "@/server/services/catalog/product-service";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireStaff();
  const raw = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const query = adminProductQuerySchema.parse({
    page: flat.page,
    pageSize: flat.pageSize,
    search: flat.search,
    status: flat.status || undefined,
    sort: flat.sort,
  });
  const result = await listAdminProducts(query);
  const current = {
    search: query.search,
    status: query.status,
    sort: query.sort,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Products"
        description="Catalog records from the Phase 4 admin product API."
        action={
          isManager(profile.role) ? (
            <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
              New product
            </Button>
          ) : null
        }
      />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="search"
          defaultValue={query.search ?? ""}
          placeholder="Search name or slug"
          className="h-8 min-w-[12rem] flex-1 border border-input bg-transparent px-2 text-sm"
        />
        <select name="status" defaultValue={query.status ?? ""} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {result.data.length === 0 ? (
        <AdminEmpty title="No products" description="No catalog rows match these filters." />
      ) : (
        <ProductTable products={result.data} />
      )}
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/products"
        params={current}
      />
    </div>
  );
}
