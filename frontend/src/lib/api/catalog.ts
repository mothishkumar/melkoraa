import { apiPage, apiRequest } from "./client";
import type { ProductDetail, ProductListItem } from "@/types/catalog";

export function fetchProducts(params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return apiPage<ProductListItem>(`/api/v1/products${qs ? `?${qs}` : ""}`);
}

export function fetchProduct(slug: string) {
  return apiRequest<ProductDetail>(`/api/v1/products/${slug}`);
}

export function fetchDrop(slug: string) {
  return apiRequest<{ name: string; description?: string | null; slug: string }>(`/api/v1/drops/${slug}`);
}
