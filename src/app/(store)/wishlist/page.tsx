import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="WISHLIST"
        description="Saved pieces will appear here after catalog and account services are connected."
      />
    </div>
  );
}
