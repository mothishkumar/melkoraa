import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { appRoleEnum } from "./enums";
import { createdAtCol, updatedAtCol, uuidPkCol } from "./helpers";

/**
 * Application profile. Authentication identity lives in auth.users.
 * user_id is unique and is linked to auth.users(id) in SQL (see migrations)
 * so Drizzle does not attempt to manage the auth schema.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuidPkCol(),
    userId: uuid("user_id").notNull(),
    role: appRoleEnum("role").notNull().default("customer"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("profiles_user_id_uidx").on(table.userId),
    index("profiles_role_idx").on(table.role),
  ],
).enableRLS();

export const addresses = pgTable(
  "addresses",
  {
    id: uuidPkCol(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    index("addresses_user_id_idx").on(table.userId),
    check(
      "addresses_line1_not_empty",
      sql`char_length(btrim(${table.addressLine1})) > 0`,
    ),
  ],
).enableRLS();
