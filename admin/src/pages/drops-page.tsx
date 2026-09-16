import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DropTable } from "@/components/admin/drop-table";
import { NewDropButton } from "@/components/admin/new-drop-button";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminDropsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { publicListQuerySchema } from "@/lib/validation/catalog";
import type { PublicDropSummary } from "@/types/catalog";

export function DropsPage() {
  const { tick } = useAdminRefresh();
  const [searchParams] = useSearchParams();
  const [drops, setDrops] = useState<PublicDropSummary[]>([]);
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
    void listAdminDropsRequest({ page: query.page, pageSize: query.pageSize })
      .then((result) => {
        if (!cancelled) {
          setDrops(result.data);
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
        title="Drops"
        description="Catalog drops from the drop APIs, including seeded Drop 001 when present in the database."
        action={<NewDropButton />}
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading drops…</p>
      ) : drops.length === 0 ? (
        <AdminEmpty title="No drops" description="No drop rows are stored yet." />
      ) : (
        <DropTable drops={drops} />
      )}
      <AdminPagination page={page} totalPages={totalPages} basePath="/drops" params={{}} />
    </div>
  );
}
