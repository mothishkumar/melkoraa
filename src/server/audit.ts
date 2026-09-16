import { sanitizeAuditMetadata } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";
import { insertAuditLog } from "@/server/repositories/admin/audit-repository";

export async function recordOperationalAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await insertAuditLog({
      userId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: sanitizeAuditMetadata(input.metadata ?? {}),
    });
  } catch {
    logger.warn("audit.write_failed", { action: input.action, entityType: input.entityType });
  }
}
