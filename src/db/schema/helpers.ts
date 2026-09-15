import { numeric, timestamp, uuid } from "drizzle-orm/pg-core";

export const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

export function createdAtCol() {
  return timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull();
}

export function updatedAtCol() {
  return timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull();
}

export function uuidPkCol() {
  return uuid("id").defaultRandom().primaryKey();
}
