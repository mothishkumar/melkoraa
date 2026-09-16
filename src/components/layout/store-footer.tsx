"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { brand } from "@/lib/brand";
import { storeFooterNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function StoreFooter() {
  const pathname = usePathname();
  const light = pathname !== "/";

  return (
    <footer
      className={cn(
        "border-t",
        light ? "store-light border-black/10 bg-[#f6f3ee] text-[#111]" : "border-white/10 bg-black text-off-white",
      )}
    >
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-16 md:grid-cols-12 md:px-8 md:py-20">
        <div className="md:col-span-5">
          <p className="editorial-display text-xl tracking-[0.4em]">{brand.name}</p>
          <p className={cn("mt-5 max-w-sm text-sm leading-7", light ? "text-[#6f6b66]" : "text-stone")}>
            {brand.tagline}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
          <FooterColumn title="SHOP" links={storeFooterNav.shop} light={light} />
          <FooterColumn title="ABOUT" links={storeFooterNav.about} light={light} />
          <FooterColumn title="HELP" links={storeFooterNav.help} light={light} />
        </div>
      </div>
      <div className={cn("border-t", light ? "border-black/10" : "border-white/10")}>
        <div
          className={cn(
            "mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-5 text-[0.62rem] tracking-[0.22em] uppercase md:flex-row md:items-center md:justify-between md:px-8",
            light ? "text-[#6f6b66]" : "text-stone",
          )}
        >
          <span>Est. 2024</span>
          <span>Individuality / Transformation / Elevation</span>
          <span>
            © {new Date().getUTCFullYear()} {brand.name}
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  light,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  light: boolean;
}) {
  return (
    <div>
      <p className="label-caps mb-4">{title}</p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "text-sm transition-colors",
                light ? "text-[#111]/70 hover:text-[#111]" : "text-off-white/75 hover:text-off-white",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
