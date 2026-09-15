import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Collection",
};

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title={slug.replaceAll("-", " ")}
        description="Collection merchandising is not loaded yet. This route is reserved for drop and collection pages."
        actionHref="/shop"
        actionLabel="View shop"
      />
    </div>
  );
}
