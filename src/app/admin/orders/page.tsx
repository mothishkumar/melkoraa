import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <AdminPlaceholder
      title="Orders"
      description="Order operations require checkout and payment services."
    />
  );
}
