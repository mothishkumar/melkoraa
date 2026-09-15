import Link from "next/link";

import { brand } from "@/lib/brand";
import { storeFooterNav } from "@/lib/navigation";

export function StoreFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-16 md:grid-cols-12 md:px-8 md:py-24">
        <div className="md:col-span-5">
          <p className="editorial-display text-2xl tracking-[0.28em]">{brand.name}</p>
          <p className="mt-6 max-w-sm text-sm leading-7 text-stone">{brand.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7 md:grid-cols-3">
          <FooterColumn title="SHOP" links={storeFooterNav.shop} />
          <FooterColumn title="ABOUT" links={storeFooterNav.about} />
          <FooterColumn title="HELP" links={storeFooterNav.help} />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-6 text-[0.65rem] tracking-[0.18em] text-stone uppercase md:flex-row md:items-center md:justify-between md:px-8">
          <span>SOCIAL — COMING WITH THE DROP</span>
          <span>© {new Date().getUTCFullYear()} {brand.name}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="label-caps mb-4">{title}</p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-off-white/80 hover:text-off-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
