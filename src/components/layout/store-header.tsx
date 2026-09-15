import Link from "next/link";

import { StoreMobileNav } from "@/components/layout/store-mobile-nav";
import { BagLink } from "@/components/layout/bag-link";
import { LogoutButton } from "@/features/auth";
import { brand } from "@/lib/brand";
import { storeNav } from "@/lib/navigation";

export function StoreHeader({
  isAuthenticated = false,
  isStaff = false,
}: {
  isAuthenticated?: boolean;
  isStaff?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-sm">
      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:h-20 md:px-8">
        <div className="flex items-center gap-4 md:hidden">
          <StoreMobileNav isAuthenticated={isAuthenticated} isStaff={isStaff} />
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {storeNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label-caps text-[0.65rem] text-off-white/80 transition-colors hover:text-off-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="editorial-display absolute left-1/2 -translate-x-1/2 text-base tracking-[0.35em] md:text-lg"
        >
          {brand.name}
        </Link>

        <div className="ml-auto flex items-center gap-5 md:gap-7">
          {isStaff ? (
            <Link
              href="/admin"
              className="label-caps hidden text-[0.65rem] text-off-white/80 hover:text-off-white sm:inline"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={isAuthenticated ? "/account" : "/login"}
            className="label-caps text-[0.65rem] text-off-white/80 hover:text-off-white"
          >
            {isAuthenticated ? "Account" : "Login"}
          </Link>
          {isAuthenticated ? (
            <span className="hidden sm:inline">
              <LogoutButton />
            </span>
          ) : null}
          <BagLink />
        </div>
      </div>
    </header>
  );
}
