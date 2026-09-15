import { paginationMeta } from "@/server/http";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import * as customerRepo from "@/server/repositories/customers/customer-repository";
import * as orderRepo from "@/server/repositories/orders/order-repository";
import type { AdminCustomer } from "@/types/admin";

function displayEmail(user: { email?: string } | null | undefined): string | null {
  const email = user?.email?.trim();
  return email ? email : null;
}

export async function listAdminCustomers(query: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  const { rows, total } = await customerRepo.listCustomerProfiles(query);
  const userIds = rows.map((row) => row.userId);
  const counts = await orderRepo.countOrdersForUsers(userIds);
  const countByUser = new Map(
    counts.map((row) => [row.userId, Number(row.value)]),
  );

  const supabase = createServiceRoleClient();
  const emails = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data.user) return [userId, null] as const;
      return [userId, displayEmail(data.user)] as const;
    }),
  );
  const emailByUser = new Map(emails);

  const data: AdminCustomer[] = rows.map((row) => ({
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: emailByUser.get(row.userId) ?? null,
    createdAt: row.createdAt.toISOString(),
    orderCount: countByUser.get(row.userId) ?? 0,
  }));

  return { data, pagination: paginationMeta(query.page, query.pageSize, total) };
}
