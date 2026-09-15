import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholder
      title="Settings"
      description="Store settings, storage buckets, and environment status will surface here. Secrets are never rendered."
    />
  );
}
