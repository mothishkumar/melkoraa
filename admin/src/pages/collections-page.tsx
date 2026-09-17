import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { CollectionTable } from "@/components/admin/collection-table";
import { NewCollectionButton } from "@/components/admin/new-collection-button";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminCollectionsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminCollectionQuerySchema } from "@/lib/validation/catalog";
import type { PublicCollection } from "@/types/catalog";

export function CollectionsPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = adminCollectionQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
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
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading collections…</p>
      ) : collections.length === 0 ? (
        <AdminEmpty title="No collections" description="No collection rows are stored yet." />
      ) : (
        <CollectionTable collections={collections} />
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/collections"
        params={{ search: query.search, status: query.status, sort: query.sort }}
      />
    </div>
  );
}
