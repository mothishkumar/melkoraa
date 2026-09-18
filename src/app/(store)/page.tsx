import Link from "next/link";
import { Suspense } from "react";

import { HomeHero } from "@/components/layout/home-hero";
import { StoreSurface } from "@/components/layout/store-surface";
import { ProductGrid } from "@/components/product/product-grid";
import { getSiteUrl } from "@/lib/auth/site-url";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { brand } from "@/lib/brand";
import { loadPublicCatalog } from "@/lib/storefront/catalog";

export const metadata = {
  title: "Home",
  description: `${brand.tagline} ${brand.drop.label}. ${brand.drop.message}`,
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.drop.message,
    url: getSiteUrl(),
  },
};

async function FeaturedDrop() {
  const [featured, user] = await Promise.all([
    loadPublicCatalog({}, { drop: "drop-001", pageSize: "6" }),
    getCurrentUser(),
  ]);
  return <HomeContent products={featured.products} isAuthenticated={Boolean(user)} />;
}

function HomeContent({
  products,
  isAuthenticated,
}: {
  products: Awaited<ReturnType<typeof loadPublicCatalog>>["products"];
  isAuthenticated: boolean;
}) {
  return (
    <>
      <HomeHero products={products} />
      <StoreSurface>
        <section className="mx-auto max-w-[1600px] px-4 py-20 md:px-8 md:py-28">
          <p className="label-caps text-center">Limited release</p>
          <h2 className="editorial-display mt-4 text-center text-4xl md:text-6xl">{brand.drop.code}</h2>
          <p className="mt-3 text-center font-heading text-xl tracking-[0.2em] uppercase text-[#111]/70">
            {brand.drop.name}
          </p>
          <p className="mx-auto mt-4 max-w-md text-center text-sm text-[#6f6b66]">
            {brand.drop.message}
          </p>
          <div className="mt-14">
            <ProductGrid
              products={products}
              isAuthenticated={isAuthenticated}
              emptyLabel="THE DROP IS BEING SET."
            />
          </div>
          <div className="mt-14 flex justify-center">
            <Link href="/drop-001" className="mk-outline border-black text-[#111] hover:bg-black hover:text-[#f6f3ee]">
              View the drop
            </Link>
          </div>
        </section>
      </StoreSurface>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-black" />
      }
    >
      <FeaturedDrop />
    </Suspense>
  );
}
