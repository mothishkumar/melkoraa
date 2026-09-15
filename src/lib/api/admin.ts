import { apiPage, apiRequest } from "@/lib/api/client";
import type { AdminAuditLog, AdminCustomer, AdminDashboardSnapshot, AdminOrderSummary } from "@/types/admin";
import type { AdminProductDetail, AdminProductListItem, PublicCategory, PublicCollection, PublicDropSummary } from "@/types/catalog";
import type { InventoryDetail, InventoryListItem } from "@/types/inventory";
import type { OrderDetailDto } from "@/types/orders";

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getAdminDashboardRequest() {
  return apiRequest<AdminDashboardSnapshot>("/api/v1/admin/dashboard");
}

export function listAdminProductsRequest(params: Record<string, string | number | undefined>) {
  return apiPage<AdminProductListItem>(`/api/v1/admin/products${qs(params)}`);
}

export function getAdminProductRequest(id: string) {
  return apiRequest<AdminProductDetail>(`/api/v1/admin/products/${id}`);
}

export function createAdminProductRequest(body: unknown) {
  return apiRequest<AdminProductDetail>("/api/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminProductRequest(id: string, body: unknown) {
  return apiRequest<AdminProductDetail>(`/api/v1/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function archiveAdminProductRequest(id: string) {
  return apiRequest<AdminProductDetail>(`/api/v1/admin/products/${id}`, { method: "DELETE" });
}

export function createAdminVariantRequest(productId: string, body: unknown) {
  return apiRequest(`/api/v1/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminVariantRequest(productId: string, variantId: string, body: unknown) {
  return apiRequest(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deactivateAdminVariantRequest(productId: string, variantId: string) {
  return apiRequest(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
    method: "DELETE",
  });
}

export function uploadAdminProductImageRequest(productId: string, form: FormData) {
  return apiRequest(`/api/v1/admin/products/${productId}/images`, {
    method: "POST",
    body: form,
  });
}

export function updateAdminProductImageRequest(productId: string, imageId: string, body: unknown) {
  return apiRequest(`/api/v1/admin/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAdminProductImageRequest(productId: string, imageId: string) {
  return apiRequest(`/api/v1/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
}

export function listAdminInventoryRequest(params: Record<string, string | number | undefined>) {
  return apiPage<InventoryListItem>(`/api/v1/admin/inventory${qs(params)}`);
}

export function getAdminInventoryRequest(variantId: string) {
  return apiRequest<InventoryDetail>(`/api/v1/admin/inventory/${variantId}`);
}

export function adjustAdminInventoryRequest(variantId: string, body: unknown) {
  return apiRequest<InventoryDetail>(`/api/v1/admin/inventory/${variantId}/adjust`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listAdminOrdersRequest(params: Record<string, string | number | undefined>) {
  return apiPage<AdminOrderSummary>(`/api/v1/admin/orders${qs(params)}`);
}

export function getAdminOrderRequest(id: string) {
  return apiRequest<
    OrderDetailDto & {
      userId: string | null;
      history: { id: string; oldStatus: string | null; newStatus: string; notes: string | null; createdAt: string }[];
    }
  >(`/api/v1/admin/orders/${id}`);
}

export function listAdminCustomersRequest(params: Record<string, string | number | undefined>) {
  return apiPage<AdminCustomer>(`/api/v1/admin/customers${qs(params)}`);
}

export function listAdminDropsRequest(params: Record<string, string | number | undefined>) {
  return apiPage<PublicDropSummary>(`/api/v1/admin/drops${qs(params)}`);
}

export function getAdminDropRequest(id: string) {
  return apiRequest<PublicDropSummary & { products: { id: string; name: string; slug: string; status: string; displayOrder: number }[] }>(
    `/api/v1/admin/drops/${id}`,
  );
}

export function createAdminDropRequest(body: unknown) {
  return apiRequest<PublicDropSummary>("/api/v1/admin/drops", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminDropRequest(id: string, body: unknown) {
  return apiRequest<PublicDropSummary>(`/api/v1/admin/drops/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function archiveAdminDropRequest(id: string) {
  return apiRequest<PublicDropSummary>(`/api/v1/admin/drops/${id}`, { method: "DELETE" });
}

export function associateAdminDropProductRequest(dropId: string, body: unknown) {
  return apiRequest(`/api/v1/admin/drops/${dropId}/products`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function dissociateAdminDropProductRequest(dropId: string, productId: string) {
  return apiRequest(`/api/v1/admin/drops/${dropId}/products/${productId}`, { method: "DELETE" });
}

export function listAdminCollectionsRequest(params: Record<string, string | number | undefined>) {
  return apiPage<PublicCollection>(`/api/v1/admin/collections${qs(params)}`);
}

export function createAdminCollectionRequest(body: unknown) {
  return apiRequest<PublicCollection>("/api/v1/admin/collections", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminCollectionRequest(id: string, body: unknown) {
  return apiRequest<PublicCollection>(`/api/v1/admin/collections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function archiveAdminCollectionRequest(id: string) {
  return apiRequest<PublicCollection>(`/api/v1/admin/collections/${id}`, { method: "DELETE" });
}

export function listAdminCategoriesRequest(params: Record<string, string | number | undefined> = { page: 1, pageSize: 50 }) {
  return apiPage<PublicCategory>(`/api/v1/admin/categories${qs(params)}`);
}

export function listAdminAuditLogsRequest(params: Record<string, string | number | undefined>) {
  return apiPage<AdminAuditLog>(`/api/v1/admin/audit-logs${qs(params)}`);
}
