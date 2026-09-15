import { HomeHero } from "@/components/layout/home-hero";
import { brand } from "@/lib/brand";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <section className="mx-auto grid max-w-[1600px] border-t border-white/10 md:grid-cols-2">
        <div className="border-b border-white/10 px-4 py-20 md:border-b-0 md:border-r md:px-8 md:py-28">
          <p className="label-caps">The drop</p>
          <h2 className="editorial-display mt-6 text-4xl md:text-6xl">{brand.drop.name}</h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-stone">
            Catalog, inventory, and checkout are not connected yet. This surface is the
            storefront foundation for DROP 001.
          </p>
        </div>
        <div className="flex flex-col justify-end px-4 py-20 md:px-10 md:py-28">
          <p className="font-heading text-2xl md:text-3xl">{brand.copy.exclusive}</p>
          <p className="mt-8 label-caps">{brand.copy.keepBuilding}</p>
        </div>
      </section>
    </>
  );
}
