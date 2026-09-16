import { StoreSurface } from "@/components/layout/store-surface";
import { brand } from "@/lib/brand";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <StoreSurface>
      <article className="mx-auto max-w-[720px] px-4 py-20 md:px-8 md:py-28">
        <p className="label-caps">{brand.name}</p>
        <h1 className="editorial-display mt-4 text-4xl">Terms</h1>
        <p className="mt-8 text-sm leading-7 text-[#6f6b66]">
          This page is a placeholder. Purchase terms will be published with checkout going live to the
          public. We do not invent legal policies here.
        </p>
      </article>
    </StoreSurface>
  );
}
