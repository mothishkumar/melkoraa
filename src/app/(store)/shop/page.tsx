import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="SHOP"
        description="Product listing, filters, and inventory availability will be served from the catalog API in a later phase. Nothing is for sale on this foundation build."
        actionHref="/"
        actionLabel="Back to home"
      />
    </div>
  );
}
