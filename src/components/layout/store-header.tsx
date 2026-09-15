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
      <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 md:h-20 md:px-8">
        <div className="flex min-w-0 items-center justify-start">
          <div className="md:hidden">
            <StoreMobileNav isAuthenticated={isAuthenticated} isStaff={isStaff} />
          </div>
          <nav className="hidden items-center gap-6 lg:gap-8 md:flex" aria-label="Primary">
            {storeNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="label-caps shrink-0 text-[0.65rem] text-off-white/80 transition-colors hover:text-off-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          className="editorial-display shrink-0 px-2 text-center text-sm tracking-[0.28em] sm:text-base md:text-lg md:tracking-[0.35em]"
        >
          {brand.name}
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-5 md:gap-7">
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
            className="label-caps shrink-0 text-[0.65rem] text-off-white/80 hover:text-off-white"
          >
            {isAuthenticated ? "Account" : "Login"}
          </Link>
          {isAuthenticated ? (
            <span className="hidden sm:inline">
              <LogoutButton />
            </span>
          ) : null}
          <BagLink isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  );
}
