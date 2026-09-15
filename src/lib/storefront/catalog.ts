import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { listPublicProducts } from "@/server/services/catalog/product-service";
import { parsePublicProductQuery } from "@/lib/validation/catalog";
import type { ProductListItem } from "@/types/catalog";
import type { PaginationMeta } from "@/server/http";

export async function loadPublicCatalog(
  searchParams: Record<string, string | string[] | undefined>,
  defaults: Record<string, string | undefined> = {},
): Promise<{ products: ProductListItem[]; pagination: PaginationMeta; query: ReturnType<typeof parsePublicProductQuery> }> {
  const flat: Record<string, string | undefined> = { ...defaults };
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") flat[key] = value;
    else if (Array.isArray(value)) flat[key] = value[0];
  }
  try {
    const query = parsePublicProductQuery(flat);
    const result = await listPublicProducts(query);
    return { products: result.data, pagination: result.pagination, query };
  } catch (error) {
    notFoundIfMissing(error);
    throw error;
  }
}
