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
    <header className="flex h-14 items-center justify-between border-b border-white/10 px-5 md:h-16 md:px-10">
      <AdminMobileNav />
      <p className="label-caps hidden md:block">Operations</p>
      <div className="flex items-center gap-5">
        <p className="label-caps hidden max-w-[14rem] truncate sm:block">
          {email ?? "Staff"} · {role}
        </p>
        <LogoutButton />
      </div>
    </header>
  );
}
