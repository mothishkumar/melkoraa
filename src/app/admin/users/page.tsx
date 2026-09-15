import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <AdminPlaceholder
      title="Staff users"
      description="No role-management API exists. Staff cannot change customer or staff roles from this dashboard."
    />
  );
}
