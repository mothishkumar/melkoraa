import { Link } from "react-router-dom";

import { BrandMark } from "@/components/layout/brand-mark";
import { StoreMobileNav } from "@/components/layout/store-mobile-nav";
import { BagLink } from "@/components/layout/bag-link";
import { LogoutButton } from "@/features/auth";
import { storeNav } from "@/lib/navigation";

export function StoreHeader({
  isAuthenticated = false,
  isStaff = false,
}: {
  isAuthenticated?: boolean;
  isStaff?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-[1600px] items-center justify-between gap-3 px-4 md:h-20 md:px-8">
        <BrandMark className="text-[0.95rem] text-off-white md:text-lg" />

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {storeNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="label-caps text-[0.62rem] text-off-white/80 transition-colors hover:text-off-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-4 md:gap-6">
          {isStaff ? (
            <Link
              to="/admin"
              className="label-caps hidden text-[0.62rem] text-off-white/80 hover:text-off-white sm:inline"
            >
              Admin
            </Link>
          ) : null}
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            className="label-caps hidden text-[0.62rem] text-off-white/80 hover:text-off-white sm:inline"
            aria-label={isAuthenticated ? "Account" : "Login"}
          >
            {isAuthenticated ? "Account" : "Login"}
          </Link>
          {isAuthenticated ? (
            <span className="hidden lg:inline">
              <LogoutButton />
            </span>
          ) : null}
          <BagLink isAuthenticated={isAuthenticated} />
          <div className="md:hidden">
            <StoreMobileNav isAuthenticated={isAuthenticated} isStaff={isStaff} />
          </div>
        </div>
      </div>
    </header>
  );
}
