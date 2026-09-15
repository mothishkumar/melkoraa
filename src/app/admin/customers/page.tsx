import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return (
    <AdminPlaceholder
      title="Customers"
      description="Customer records will be read from profiles after authentication is live."
    />
  );
}
