import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminAccessProvider } from "@/features/admin/access";
import { requireStaff } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, user } = await requireStaff();

  return (
    <AdminAccessProvider role={profile.role}>
      <div className="admin-shell flex min-h-full bg-[#f3f4f6] font-sans text-sm text-zinc-900">
        <AdminSidebar role={profile.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader email={user.email} role={profile.role} />
          <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </AdminAccessProvider>
  );
}
