import { apiPage, apiRequest } from "@/src/api/client";
import type {
  ProductDetail,
  ProductListItem,
  ProductListQuery,
  PublicCategory,
  PublicCollection,
  PublicDropSummary,
} from "@/src/api/types/catalog";

function toQuery(query?: ProductListQuery) {
  return {
    page: query?.page,
    pageSize: query?.pageSize,
    search: query?.search,
    category: query?.category,
    productType: query?.productType,
    collection: query?.collection,
    drop: query?.drop,
    isNew: query?.isNew,
    sort: query?.sort,
    minPrice: query?.minPrice,
    maxPrice: query?.maxPrice,
  };
}

export const productsApi = {
  list(query?: ProductListQuery) {
    return apiPage<ProductListItem>("/products", toQuery(query));
  },

  getBySlug(slug: string) {
    return apiRequest<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  },

  listCategories(query?: { page?: number; pageSize?: number }) {
    return apiPage<PublicCategory>("/categories", query);
  },

  listCollections(query?: { page?: number; pageSize?: number }) {
    return apiPage<PublicCollection>("/collections", query);
  },

  listDrops(query?: { page?: number; pageSize?: number }) {
    return apiPage<PublicDropSummary>("/drops", query);
  },

  getDropBySlug(slug: string) {
    return apiRequest<PublicDropSummary & { products: ProductListItem[] }>(
      `/drops/${encodeURIComponent(slug)}`,
    );
  },
};
