import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Inventory" };

export default function AdminInventoryPage() {
  return (
    <AdminPlaceholder
      title="Inventory"
      description="On-hand, reserved, and sold quantities will be managed here with atomic transactions."
    />
  );
}
