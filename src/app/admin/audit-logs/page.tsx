import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Audit logs" };

export default function AdminAuditLogsPage() {
  return (
    <AdminPlaceholder
      title="Audit logs"
      description="Admin actions will be recorded without storing secrets."
    />
  );
}
