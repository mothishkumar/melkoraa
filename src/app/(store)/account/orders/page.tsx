import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Orders",
};

export default function AccountOrdersPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="ORDERS"
        description="Order history is empty until checkout and payments exist."
        actionHref="/account"
        actionLabel="Back to account"
      />
    </div>
  );
}
