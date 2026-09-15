import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireManager } from "@/lib/auth/require-role";
import { listAdminCategories } from "@/server/services/catalog/category-service";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireManager();
  const categories = await listAdminCategories(1, 50);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader title="New product" description="Creates a catalog row through POST /api/v1/admin/products." />
      <ProductForm categories={categories.data} />
    </div>
  );
}
