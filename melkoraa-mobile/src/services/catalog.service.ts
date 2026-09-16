import { productsApi } from "@/src/api/products";
import type {
  ProductDetail,
  ProductListItem,
  ProductListQuery,
  PublicCategory,
  PublicCollection,
} from "@/src/api/types/catalog";
import type { PaginatedResponse } from "@/src/api/types/common";

export type HomeFeed = {
  newArrivals: ProductListItem[];
  featured: ProductListItem[];
  categories: PublicCategory[];
  collections: PublicCollection[];
};

export const catalogService = {
  async getHomeFeed(): Promise<HomeFeed> {
    const [newArrivals, featured, categoriesPage, collectionsPage] = await Promise.all([
      productsApi.list({ page: 1, pageSize: 8, isNew: true, sort: "newest" }),
      productsApi.list({ page: 1, pageSize: 8, sort: "newest" }),
      productsApi.listCategories({ page: 1, pageSize: 12 }),
      productsApi.listCollections({ page: 1, pageSize: 6 }),
    ]);

    return {
      newArrivals: newArrivals.data,
      featured: featured.data,
      categories: categoriesPage.data,
      collections: collectionsPage.data,
    };
  },

  listProducts(query?: ProductListQuery): Promise<PaginatedResponse<ProductListItem>> {
    return productsApi.list(query);
  },

  getProduct(slug: string): Promise<ProductDetail> {
    return productsApi.getBySlug(slug);
  },

  listCategories(page = 1, pageSize = 50) {
    return productsApi.listCategories({ page, pageSize });
  },

  listCollections(page = 1, pageSize = 20) {
    return productsApi.listCollections({ page, pageSize });
  },
};
