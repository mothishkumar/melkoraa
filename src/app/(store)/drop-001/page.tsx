import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product/product-grid";
import { brand } from "@/lib/brand";
import { loadPublicCatalog } from "@/lib/storefront/catalog";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { getPublicDropBySlug } from "@/server/services/catalog/drop-service";

export const metadata = {
  title: brand.drop.label,
  description: `${brand.drop.message} ${brand.tagline}`,
  openGraph: {
    title: `${brand.drop.label} — ${brand.name}`,
    description: brand.drop.message,
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
  const catalog = await loadPublicCatalog({}, { drop: "drop-001", pageSize: "20" });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-20">
      <p className="label-caps">{drop.name.toUpperCase() === "THE BUILDER" ? brand.drop.code : drop.name}</p>
      <h1 className="editorial-display mt-4 text-5xl md:text-7xl">{brand.drop.name}</h1>
      <p className="mt-6 font-heading text-2xl">{brand.drop.message}</p>
      {drop.description ? (
        <p className="mt-6 max-w-xl text-sm leading-7 text-stone">{drop.description}</p>
      ) : (
        <p className="mt-6 max-w-xl text-sm leading-7 text-stone">
          The first MELKORAA drop. Architectural streetwear, limited in spirit, built from nothing.
        </p>
      )}
      <div className="mt-16">
        <ProductGrid products={catalog.products} />
      </div>
    </div>
  );
}
