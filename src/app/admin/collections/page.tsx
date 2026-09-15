import { CollectionTable } from "@/components/admin/collection-table";
import { NewCollectionButton } from "@/components/admin/new-collection-button";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { requireStaff } from "@/lib/auth/require-role";
import { publicListQuerySchema } from "@/lib/validation/catalog";
import { listAdminCollections } from "@/server/services/catalog/collection-service";

export const metadata = { title: "Collections" };

export default async function AdminCollectionsPage({
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
  const result = await listAdminCollections(query.page, query.pageSize);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Collections"
        description="Merchandising collections from the Phase 4 collection APIs. Product membership is not stored on collections."
        action={<NewCollectionButton />}
      />
      {result.data.length === 0 ? (
        <AdminEmpty title="No collections" description="No collection rows are stored yet." />
      ) : (
        <CollectionTable collections={result.data} />
      )}
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/collections"
        params={{}}
      />
    </div>
  );
}
