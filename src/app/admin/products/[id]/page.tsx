import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Edit product" };

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AdminPlaceholder
      title="Product"
      description={`Product ${id} cannot be loaded yet. CRUD is reserved for a later phase.`}
    />
  );
}
