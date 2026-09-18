import { notFound } from "next/navigation";

import { StoreSurface } from "@/components/layout/store-surface";
import { ProductGrid } from "@/components/product/product-grid";
import { getSiteUrl } from "@/lib/auth/site-url";
import { brand } from "@/lib/brand";
import { loadPublicCatalog } from "@/lib/storefront/catalog";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { getPublicDropBySlug } from "@/server/services/catalog/drop-service";

export const metadata = {
  title: brand.drop.label,
  description: `${brand.drop.message} ${brand.tagline}`,
  openGraph: {
    title: `${brand.drop.label} — ${brand.name}`,
    description: brand.drop.message,
    url: getSiteUrl(),
  },
};

export default async function Drop001Page() {
  let drop;
  try {
    drop = await getPublicDropBySlug("drop-001");
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!drop) notFound();
  const [catalog, user] = await Promise.all([
    loadPublicCatalog({}, { drop: "drop-001", pageSize: "20" }),
    getCurrentUser(),
  ]);

  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-20">
        <p className="label-caps text-center">Limited release</p>
        <h1 className="editorial-display mt-4 text-center text-5xl md:text-7xl">{brand.drop.code}</h1>
        <p className="mt-3 text-center font-heading text-xl tracking-[0.28em] uppercase text-[#111]/75">
          {drop.name}
        </p>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-[#6f6b66]">
          {drop.description ?? brand.drop.message}
        </p>
        <div className="mt-16">
          <ProductGrid products={catalog.products} isAuthenticated={Boolean(user)} />
        </div>
      </div>
    </StoreSurface>
  );
}
