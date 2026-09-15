import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-role";
import { inventoryListQuerySchema } from "@/lib/validation/inventory";
import { listAdminInventory } from "@/server/services/inventory/inventory-service";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage({
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
  const query = inventoryListQuerySchema.parse({
    ...flat,
    availability: flat.availability || undefined,
  });
  const result = await listAdminInventory(query);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Inventory"
        description="On-hand, reserved, and sold from the Phase 5 inventory API. Mutations require manager or admin."
      />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="search"
          defaultValue={query.search ?? ""}
          placeholder="Search SKU or product"
          className="h-8 min-w-[12rem] flex-1 border border-input bg-transparent px-2 text-sm"
        />
        <select
          name="availability"
          defaultValue={query.availability ?? ""}
          className="h-8 border border-input bg-transparent px-2 text-sm"
        >
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
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {result.data.length === 0 ? (
        <AdminEmpty title="No inventory rows" description="Initialize inventory on a variant before it appears here." />
      ) : (
        <InventoryTable rows={result.data} />
      )}
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/inventory"
        params={{ search: query.search, availability: query.availability, sort: query.sort }}
      />
    </div>
  );
}
