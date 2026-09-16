import { StoreSurface } from "@/components/layout/store-surface";
import { ProductFilters } from "@/components/product/product-filters";
import { Pagination, ProductGrid } from "@/components/product/product-grid";
import { getSiteUrl } from "@/lib/auth/site-url";
import { brand } from "@/lib/brand";
import { loadPublicCatalog } from "@/lib/storefront/catalog";
import { listPublicCategories } from "@/server/services/catalog/category-service";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWishlist } from "@/server/services/wishlist/wishlist-service";

export const metadata = {
  title: "Shop",
  description: `Shop ${brand.drop.label}. ${brand.tagline}`,
  openGraph: {
    title: `Shop — ${brand.name}`,
    description: brand.drop.message,
    url: getSiteUrl(),
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { products, pagination, query } = await loadPublicCatalog(params);
  const categories = await listPublicCategories(1, 50);
  const user = await getCurrentUser();
  let wishlisted = new Set<string>();
  if (user) {
    const wishlist = await getWishlist(user.id);
    wishlisted = new Set(wishlist.items.map((item) => item.productId));
  }
  const current = {
    category: query.category,
    sort: query.sort,
    drop: query.drop,
    collection: query.collection,
    search: query.search,
    isNew: query.isNew === undefined ? undefined : String(query.isNew),
  };

  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
        <p className="label-caps text-center">{brand.drop.label}</p>
        <h1 className="editorial-display mt-4 text-center text-4xl md:text-6xl">Shop</h1>
        <ProductFilters categories={categories.data} current={current} basePath="/products" />
        <div className="mt-10">
          <ProductGrid products={products} wishlistedIds={wishlisted} showWishlist={Boolean(user)} />
        </div>
        <Pagination pagination={pagination} basePath="/products" searchParams={current} />
      </div>
    </StoreSurface>
  );
}
