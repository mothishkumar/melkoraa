import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Addresses",
};

export default function AccountAddressesPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="ADDRESSES"
        description="Customer addresses will be stored per user. This screen is a route placeholder."
        actionHref="/account"
        actionLabel="Back to account"
      />
    </div>
  );
}
