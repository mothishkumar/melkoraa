import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { CollectionTable } from "@/components/admin/collection-table";
import { NewCollectionButton } from "@/components/admin/new-collection-button";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminCollectionsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { publicListQuerySchema } from "@/lib/validation/catalog";
import type { PublicCollection } from "@/types/catalog";

export function CollectionsPage() {
  const { tick } = useAdminRefresh();
  const [searchParams] = useSearchParams();
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = publicListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminCollectionsRequest({ page: query.page, pageSize: query.pageSize })
      .then((result) => {
        if (!cancelled) {
          setCollections(result.data);
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
        title="Collections"
        description="Merchandising collections from the collection APIs."
        action={<NewCollectionButton />}
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading collections…</p>
      ) : collections.length === 0 ? (
        <AdminEmpty title="No collections" description="No collection rows are stored yet." />
      ) : (
        <CollectionTable collections={collections} />
      )}
      <AdminPagination page={page} totalPages={totalPages} basePath="/collections" params={{}} />
    </div>
  );
}
