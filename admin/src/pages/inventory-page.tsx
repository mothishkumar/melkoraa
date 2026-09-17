import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Button } from "@/components/ui/button";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminInventoryRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { inventoryListQuerySchema } from "@/lib/validation/inventory";
import type { InventoryListItem } from "@/types/inventory";

export function InventoryPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<InventoryListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = inventoryListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    availability: searchParams.get("availability") || undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminInventoryRequest({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      availability: query.availability,
      sort: query.sort,
    })
      .then((result) => {
        if (!cancelled) {
          setRows(result.data);
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
        title="Inventory"
        description="On-hand, reserved, and sold from the inventory API. Mutations require manager or admin."
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
          placeholder="Search SKU or product"
          className="h-8 min-w-[12rem] flex-1 border border-input bg-transparent px-2 text-sm"
        />
        <select name="availability" defaultValue={query.availability ?? ""} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="">All</option>
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-8 border border-input bg-transparent px-2 text-sm">
          <option value="updated_desc">Updated</option>
          <option value="available_asc">Available ↑</option>
          <option value="on_hand_desc">On hand ↓</option>
          <option value="sku_asc">SKU</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading inventory…</p>
      ) : rows.length === 0 ? (
        <AdminEmpty title="No inventory rows" description="Initialize inventory on a variant before it appears here." />
      ) : (
        <InventoryTable rows={rows} />
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/inventory"
        params={{ search: query.search, availability: query.availability, sort: query.sort }}
      />
    </div>
  );
}
