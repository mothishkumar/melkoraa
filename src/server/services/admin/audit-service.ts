import { sanitizeAuditMetadata } from "@/lib/admin/audit";
import { paginationMeta } from "@/server/http";
import * as auditRepo from "@/server/repositories/admin/audit-repository";
import type { AdminAuditLog } from "@/types/admin";

export async function listAdminAuditLogs(query: { page: number; pageSize: number }) {
  const { rows, total } = await auditRepo.listAuditLogs(query);
  const data: AdminAuditLog[] = rows.map((row) => ({
    id: row.id,
    actorId: row.userId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: sanitizeAuditMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
  }));
  return { data, pagination: paginationMeta(query.page, query.pageSize, total) };
}
