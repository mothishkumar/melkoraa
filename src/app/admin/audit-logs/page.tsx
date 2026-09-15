import { AdminEmpty, AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireManager } from "@/lib/auth/require-role";
import { adminAuditQuerySchema } from "@/lib/validation/admin";
import { listAdminAuditLogs } from "@/server/services/admin/audit-service";

export const metadata = { title: "Audit logs" };

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireManager();
  const raw = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const query = adminAuditQuerySchema.parse(flat);
  const result = await listAdminAuditLogs(query);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Audit logs"
        description="Read-only view of public.audit_logs. Application services currently log operational events to the application logger; they do not write audit_logs rows. This page does not invent events."
      />
      {result.data.length === 0 ? (
        <AdminEmpty
          title="No audit rows"
          description="The table exists and is readable, but no writers have been wired in catalog, inventory, or order services yet."
        />
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
              {result.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="max-w-[8rem] truncate font-mono text-xs">
                    {row.actorId ?? "—"}
                  </TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-xs">
                    {JSON.stringify(row.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        basePath="/admin/audit-logs"
        params={{}}
      />
    </div>
  );
}
