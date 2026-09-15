import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Product",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title={slug.replaceAll("-", " ")}
        description="Gallery, variants, limited-edition numbering, and add to cart are not implemented in Phase 1."
        actionHref="/shop"
        actionLabel="View shop"
      />
    </div>
  );
}
