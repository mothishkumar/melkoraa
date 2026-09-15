import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholder
      title="Settings"
      description="Environment secrets stay on the server. There is no settings UI for Razorpay keys, database URLs, or service-role credentials."
    />
  );
}
