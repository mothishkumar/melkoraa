import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="CHECKOUT"
        description="Checkout, inventory reservation, and payments are intentionally unimplemented. This route is protected once Supabase Auth is configured."
        actionHref="/cart"
        actionLabel="Return to bag"
      />
    </div>
  );
}
