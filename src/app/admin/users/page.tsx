import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <AdminPlaceholder
      title="Users"
      description="Role assignment (admin, manager, staff) will be enforced server-side in the auth phase."
    />
  );
}
