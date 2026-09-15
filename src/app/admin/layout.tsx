import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireStaff } from "@/lib/auth/require-role";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, user } = await requireStaff();

  return (
    <div className="flex min-h-full bg-black text-off-white">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader email={user.email} role={profile.role} />
        <main className="flex-1 px-5 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
