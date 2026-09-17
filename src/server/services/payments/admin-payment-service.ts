import { formatMoney } from "@/lib/catalog/money";
import { paginationMeta } from "@/server/http";
import * as paymentRepo from "@/server/repositories/payments/payment-repository";

export type AdminPaymentQuery = {
  page: number;
  pageSize: number;
  search?: string;
  provider?: string;
  status?: "pending" | "authorized" | "paid" | "failed" | "refunded" | "partially_refunded";
  sort: "newest" | "oldest" | "amount_asc" | "amount_desc";
};

export async function listAdminPayments(query: AdminPaymentQuery) {
  const { rows, total } = await paymentRepo.listAdminPayments(query);
  return {
    data: rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      provider: row.provider,
      status: row.status,
      amount: formatMoney(row.amount),
      currency: row.currency,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}
