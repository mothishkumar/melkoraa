import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "New product" };

export default function AdminNewProductPage() {
  return (
    <AdminPlaceholder
      title="New product"
      description="The product editor will collect name, slug, variants, images, and inventory. Saving is disabled until the catalog API exists."
    />
  );
}
