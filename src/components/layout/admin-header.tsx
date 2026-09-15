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
    <header className="flex h-14 items-center justify-between border-b border-white/10 px-4 md:h-14 md:px-6">
      <AdminMobileNav role={role} />
      <p className="hidden text-xs uppercase tracking-[0.16em] text-muted-foreground md:block">
        Internal
      </p>
      <div className="flex items-center gap-4">
        <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
          <span className="text-foreground">{email ?? "Staff"}</span>
          <span className="mx-2">·</span>
          <span className="uppercase tracking-[0.12em]">{role}</span>
        </p>
        <LogoutButton />
      </div>
    </header>
  );
}
