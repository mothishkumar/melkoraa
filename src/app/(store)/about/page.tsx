import { StoreSurface } from "@/components/layout/store-surface";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "About",
  description: brand.tagline,
};

export default function AboutPage() {
  return (
    <StoreSurface>
      <article className="mx-auto max-w-[1100px] px-4 py-20 md:px-8 md:py-32">
        <p className="label-caps">{brand.name}</p>
        <h1 className="editorial-display mt-6 text-5xl md:text-7xl">{brand.tagline}</h1>
        <div className="mt-16 grid gap-16 md:grid-cols-2">
          <p className="text-sm leading-8 text-[#6f6b66]">
            MELKORAA is a premium contemporary streetwear house. DROP 001 — THE BUILDER is six
            production oversized tees: an identity trio and three manifesto graphics.
          </p>
          <p className="font-heading text-2xl leading-snug md:text-3xl">{brand.copy.path}</p>
        </div>
      </article>
    </StoreSurface>
  );
}
