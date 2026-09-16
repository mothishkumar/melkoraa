import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DropTable } from "@/components/admin/drop-table";
import { NewDropButton } from "@/components/admin/new-drop-button";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminDropsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminDropQuerySchema } from "@/lib/validation/catalog";
import type { PublicDropSummary } from "@/types/catalog";

export function DropsPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drops, setDrops] = useState<PublicDropSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = adminDropQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
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
          placeholder="Search name, slug, or description"
          className="h-9 min-w-[12rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <select name="status" defaultValue={query.status ?? ""} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="">All statuses</option>
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          <option value="active">active</option>
          <option value="ended">ended</option>
          <option value="archived">archived</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="start_asc">Start ↑</option>
          <option value="start_desc">Start ↓</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading drops…</p>
      ) : drops.length === 0 ? (
        <AdminEmpty title="No drops" description="No drop rows are stored yet." />
      ) : (
        <DropTable drops={drops} />
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/drops"
        params={{ search: query.search, status: query.status, sort: query.sort }}
      />
    </div>
  );
}
