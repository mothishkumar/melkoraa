import { count, desc } from "drizzle-orm";

import { auditLogs } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listAuditLogs(
  filters: { page: number; pageSize: number },
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  return loadPagedRows(
    () =>
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
    () => client.select({ value: count() }).from(auditLogs),
  );
}

export async function insertAuditLog(
  values: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .insert(auditLogs)
    .values({
      userId: values.userId ?? null,
      action: values.action,
      entityType: values.entityType,
      entityId: values.entityId ?? null,
      metadata: values.metadata ?? {},
    })
    .returning({ id: auditLogs.id });
  return row ?? null;
}
