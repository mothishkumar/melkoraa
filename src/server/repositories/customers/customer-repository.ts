import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { profiles } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { orderDb, type OrderDb } from "@/server/repositories/orders/db";
import { escapeIlike } from "@/lib/catalog/rules";

export async function listCustomerProfiles(
  filters: {
    page: number;
    pageSize: number;
    search?: string;
    sort: "newest" | "oldest" | "name_asc" | "name_desc";
  },
  db?: OrderDb,
) {
  const client = orderDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const conditions: SQL[] = [eq(profiles.role, "customer")];
  if (filters.search) {
    const pattern = `%${escapeIlike(filters.search)}%`;
    const search = or(
      ilike(profiles.firstName, pattern),
      ilike(profiles.lastName, pattern),
      ilike(profiles.phone, pattern),
    );
    if (search) conditions.push(search);
  }
  const where = and(...conditions);
  const order =
    filters.sort === "oldest"
      ? [asc(profiles.createdAt), asc(profiles.id)]
      : filters.sort === "name_asc"
        ? [asc(profiles.firstName), asc(profiles.lastName), asc(profiles.id)]
        : filters.sort === "name_desc"
          ? [desc(profiles.firstName), desc(profiles.lastName), asc(profiles.id)]
          : [desc(profiles.createdAt), desc(profiles.id)];
  return loadPagedRows(
    () =>
      client
        .select({
          userId: profiles.userId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          phone: profiles.phone,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(where)
        .orderBy(...order)
        .limit(filters.pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(profiles).where(where),
  );
}
