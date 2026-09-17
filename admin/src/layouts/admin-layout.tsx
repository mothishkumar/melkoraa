import { Outlet } from "react-router-dom";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { AdminAccessProvider } from "@/features/admin/access";
import { AdminRefreshProvider } from "@/contexts/admin-refresh-context";
import type { UserRole } from "@/lib/auth/types";

export function AdminLayout() {
  const { user } = useAuth();
  const role = (user?.role ?? "staff") as UserRole;

  return (
    <AdminAccessProvider role={role}>
      <AdminRefreshProvider>
        <div className="admin-shell flex min-h-full bg-[#f3f4f6] font-sans text-sm text-zinc-900">
          <AdminSidebar role={role} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader email={user?.email} role={role} />
            <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8">
              <Outlet />
            </main>
          </div>
        </div>
      </AdminRefreshProvider>
    </AdminAccessProvider>
  );
}
