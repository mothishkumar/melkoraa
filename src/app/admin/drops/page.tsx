import { DropTable } from "@/components/admin/drop-table";
import { NewDropButton } from "@/components/admin/new-drop-button";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { requireStaff } from "@/lib/auth/require-role";
import { publicListQuerySchema } from "@/lib/validation/catalog";
import { listAdminDrops } from "@/server/services/catalog/drop-service";

export const metadata = { title: "Drops" };

export default async function AdminDropsPage({
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
  const query = publicListQuerySchema.parse(flat);
  const result = await listAdminDrops(query.page, query.pageSize);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Drops"
        description="Catalog drops from the Phase 4 drop APIs, including seeded Drop 001 when present in the database."
        action={<NewDropButton />}
      />
      {result.data.length === 0 ? (
        <AdminEmpty title="No drops" description="No drop rows are stored yet." />
      ) : (
        <DropTable drops={result.data} />
      )}
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/drops"
        params={{}}
      />
    </div>
  );
}
