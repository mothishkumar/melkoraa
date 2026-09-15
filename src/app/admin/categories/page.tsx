import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <AdminPlaceholder
      title="Categories"
      description="Category CRUD exists on /api/v1/admin/categories. Product category assignment is on the product form. A dedicated categories table is not part of Phase 10 navigation."
    />
  );
}
