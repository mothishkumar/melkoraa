import { count, desc } from "drizzle-orm";

import { auditLogs } from "@/db/schema";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listAuditLogs(
  filters: { page: number; pageSize: number },
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const [rows, totals] = await Promise.all([
    client
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.pageSize)
      .offset(offset),
    client.select({ value: count() }).from(auditLogs),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
}
