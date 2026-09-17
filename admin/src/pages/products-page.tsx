import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { ProductTable } from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/features/admin/access";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminProductsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminProductQuerySchema } from "@/lib/validation/catalog";
import type { AdminProductListItem } from "@/types/catalog";

export function ProductsPage() {
  const { canMutate } = useAdminAccess();
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = adminProductQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") || undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminProductsRequest({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      sort: query.sort,
    })
      .then((result) => {
        if (!cancelled) {
          setProducts(result.data);
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
        title="Products"
        description="Catalog records from the admin product API."
        action={
          canMutate ? (
            <Button nativeButton={false} render={<Link to="/products/new" />}>
              New product
            </Button>
          ) : null
        }
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
          placeholder="Search name or slug"
          className="h-9 min-w-[12rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <select name="status" defaultValue={query.status ?? ""} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : products.length === 0 ? (
        <AdminEmpty title="No products" description="No catalog rows match these filters." />
      ) : (
        <ProductTable products={products} />
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/products"
        params={{ search: query.search, status: query.status, sort: query.sort }}
      />
    </div>
  );
}
