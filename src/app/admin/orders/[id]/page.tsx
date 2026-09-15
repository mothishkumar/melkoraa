import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Order" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AdminPlaceholder
      title="Order"
      description={`Order ${id} is a reserved route. Status history and snapshots are not available.`}
    />
  );
}
