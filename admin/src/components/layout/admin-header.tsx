import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";
import { LogoutButton } from "@/features/auth";
import type { UserRole } from "@/lib/auth/types";

export function AdminHeader({
  email,
  role,
}: {
  email?: string | null;
  role: UserRole;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 md:px-8">
      <AdminMobileNav role={role} />
      <p className="hidden text-sm text-zinc-500 md:block">Operations</p>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-xs sm:block">
          <p className="font-medium text-zinc-900">{email ?? "Staff"}</p>
          <p className="uppercase tracking-[0.14em] text-zinc-500">{role}</p>
        </div>
        <LogoutButton className="text-zinc-600 hover:text-zinc-900" />
      </div>
    </header>
  );
}
