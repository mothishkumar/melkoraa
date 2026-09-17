import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { listAdminAuditLogsRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adminAuditQuerySchema } from "@/lib/validation/admin";
import type { AdminAuditLog } from "@/types/admin";

export function AuditLogsPage() {
  const { tick } = useAdminRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = adminAuditQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    entityType: searchParams.get("entityType") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminAuditLogsRequest({ page: query.page, pageSize: query.pageSize })
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
        title="Audit logs"
        description="Read-only view of public.audit_logs."
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
          placeholder="Search action, entity, or ID"
          className="h-9 min-w-[12rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <input
          name="action"
          defaultValue={query.action ?? ""}
          placeholder="Exact action"
          className="h-9 w-32 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <input
          name="entityType"
          defaultValue={query.entityType ?? ""}
          placeholder="Exact entity"
          className="h-9 w-32 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        />
        <select name="sort" defaultValue={query.sort} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading audit logs…</p>
      ) : rows.length === 0 ? (
        <AdminEmpty title="No audit rows" description="No audit log rows match these filters." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="max-w-[8rem] truncate font-mono text-xs">{row.actorId ?? "—"}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-xs">{JSON.stringify(row.metadata)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/audit-logs"
        params={{ search: query.search, action: query.action, entityType: query.entityType, sort: query.sort }}
      />
    </div>
  );
}
