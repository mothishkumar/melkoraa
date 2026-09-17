import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { auditLogs } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { escapeIlike } from "@/lib/catalog/rules";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listAuditLogs(
  filters: {
    page: number;
    pageSize: number;
    search?: string;
    action?: string;
    entityType?: string;
    sort: "newest" | "oldest";
  },
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const conditions: SQL[] = [];
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.search) {
    const pattern = `%${escapeIlike(filters.search)}%`;
    const search = or(
      ilike(auditLogs.action, pattern),
      ilike(auditLogs.entityType, pattern),
      ilike(sql<string>`cast(${auditLogs.entityId} as text)`, pattern),
      ilike(sql<string>`cast(${auditLogs.userId} as text)`, pattern),
    );
    if (search) conditions.push(search);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const order =
    filters.sort === "oldest"
      ? [asc(auditLogs.createdAt), asc(auditLogs.id)]
      : [desc(auditLogs.createdAt), desc(auditLogs.id)];
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
        .where(where)
        .orderBy(...order)
        .limit(filters.pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(auditLogs).where(where),
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
