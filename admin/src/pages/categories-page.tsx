import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { CategoryForm } from "@/components/admin/category-form";
import { CategoryTable } from "@/components/admin/category-table";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminAccess } from "@/features/admin/access";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminCategoriesRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminCategoryQuerySchema } from "@/lib/validation/catalog";
import type { PublicCategory } from "@/types/catalog";

export function CategoriesPage() {
  const { canMutate } = useAdminAccess();
  const { tick, refresh } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const query = adminCategoryQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminCategoriesRequest(query)
      .then((result) => {
        if (!cancelled) {
          setCategories(result.data);
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
  }, [searchParams, tick]);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Categories"
        description="Catalog category records. Manager changes are reflected in the customer catalog."
        action={
          canMutate ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New category
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
          placeholder="Search name, slug, or description"
          className="h-9 min-w-[12rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <select name="sort" defaultValue={query.sort} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : categories.length === 0 ? (
        <AdminEmpty title="No categories" description="Create the first category to organize products." />
      ) : (
        <CategoryTable categories={categories} />
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/categories"
        params={{ search: query.search, sort: query.sort }}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSaved={() => {
              setCreateOpen(false);
              refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
