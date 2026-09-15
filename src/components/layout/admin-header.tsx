import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";

export function AdminHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 px-5 md:h-16 md:px-10">
      <AdminMobileNav />
      <p className="label-caps hidden md:block">Operations</p>
      <p className="label-caps">Session — Phase 1 foundation</p>
    </header>
  );
}
