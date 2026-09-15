import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Order",
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title={`Order ${id}`}
        description="Order snapshots, fulfillment, and payment status are not available yet."
        actionHref="/account/orders"
        actionLabel="All orders"
      />
    </div>
  );
}
