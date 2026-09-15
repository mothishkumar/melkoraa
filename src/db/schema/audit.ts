import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { createdAtCol, uuidPkCol } from "./helpers";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuidPkCol(),
    userId: uuid("user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAtCol(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_user_id_idx").on(table.userId),
    check("audit_logs_action_not_empty", sql`char_length(btrim(${table.action})) > 0`),
  ],
).enableRLS();
