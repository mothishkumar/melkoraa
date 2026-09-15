import Link from "next/link";
import { Suspense } from "react";

import { HomeHero } from "@/components/layout/home-hero";
import { ProductGrid } from "@/components/product/product-grid";
import { brand } from "@/lib/brand";
import { loadPublicCatalog } from "@/lib/storefront/catalog";

export const metadata = {
  title: "Home",
  description: `${brand.tagline} ${brand.drop.label}. ${brand.drop.message}`,
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.drop.message,
  },
};

async function FeaturedDrop() {
  const featured = await loadPublicCatalog({}, { drop: "drop-001", pageSize: "4" });
  return <ProductGrid products={featured.products} emptyLabel="THE DROP IS BEING SET." />;
}

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <section className="mx-auto grid max-w-[1600px] border-t border-white/10 md:grid-cols-2">
        <div className="border-b border-white/10 px-4 py-20 md:border-b-0 md:border-r md:px-8 md:py-28">
          <p className="label-caps">{brand.drop.code}</p>
          <h2 className="editorial-display mt-6 text-4xl md:text-6xl">{brand.drop.name}</h2>
          <p className="mt-6 font-heading text-xl">{brand.drop.message}</p>
          <p className="mt-6 max-w-md text-sm leading-7 text-stone">
            MELKORAA is a premium contemporary streetwear house. DROP 001 — THE BUILDER is the first
            statement: constructed, quiet, and not made for everyone.
          </p>
        </div>
        <div className="flex flex-col justify-end px-4 py-20 md:px-10 md:py-28">
          <p className="font-heading text-2xl md:text-3xl">{brand.copy.exclusive}</p>
          <p className="mt-8 label-caps">{brand.copy.keepBuilding}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-20 md:px-8">
        <p className="label-caps">Featured</p>
        <h2 className="editorial-display mt-4 text-3xl md:text-5xl">DROP 001</h2>
        <div className="mt-12">
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="aspect-[3/4] bg-charcoal" />
                ))}
              </div>
            }
          >
            <FeaturedDrop />
          </Suspense>
        </div>
      </section>

      <section className="border-y border-white/10">
        <div className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-32">
          <p className="editorial-display text-[clamp(2rem,8vw,7rem)] leading-[0.9]">
            {brand.tagline}
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-24 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="label-caps">{brand.drop.code}</p>
          <h2 className="editorial-display mt-4 text-4xl md:text-6xl">{brand.drop.name}</h2>
        </div>
        <Link
          href="/drop-001"
          className="inline-flex w-fit border border-off-white px-8 py-4 text-[0.7rem] tracking-[0.28em] uppercase hover:bg-off-white hover:text-black"
        >
          Shop now
        </Link>
      </section>
    </>
  );
}
