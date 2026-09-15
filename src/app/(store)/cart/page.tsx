import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Bag",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="BAG"
        description="Guest and authenticated carts are not connected. This route is reserved for bag and checkout handoff."
        actionHref="/shop"
        actionLabel="Continue to shop"
      />
    </div>
  );
}
