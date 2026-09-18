import { Link } from "react-router-dom";

import { Image } from "@/components/ui/image";
import { DROP_001_COLORS, type Drop001Style } from "@/lib/catalog/drop-001";
import { formatInr } from "@/lib/catalog/money";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/catalog";

export function ColorDots({
  colorKeys,
}: {
  colorKeys: readonly (keyof typeof DROP_001_COLORS)[];
}) {
  return (
    <ul className="flex items-center gap-2" aria-label="Colour options">
      {colorKeys.map((key) => (
        <li
          key={key}
          title={DROP_001_COLORS[key].name}
          className="size-3 rounded-full border border-black/25"
          style={{ background: DROP_001_COLORS[key].code }}
        />
      ))}
    </ul>
  );
}

export function LookbookCard({
  style,
  product,
}: {
  style: Drop001Style;
  product?: ProductListItem;
}) {
  const dark = style.theme !== "light";
  const href = product ? `/products/${product.slug}` : undefined;

  return (
    <article
      className={cn(
        "flex h-full flex-col px-5 py-8 md:px-8 md:py-10",
        style.theme === "light" && "bg-[#e7dfd2] text-[#111]",
        style.theme === "dark" && "bg-[#111111] text-[#f4f1ea]",
        style.theme === "stone" && "bg-[#9a938a] text-[#111]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-[0.65rem] tracking-[0.28em]", dark && style.theme === "dark" ? "text-[#a6a29a]" : "text-current/55")}>
            {style.code} {style.line}
          </p>
          <h2 className="editorial-display mt-2 text-3xl md:text-4xl">{style.name.replace(" Oversized Tee", "")}</h2>
          <p className="mt-2 text-[0.72rem] tracking-[0.16em] uppercase text-current/70">{style.tagline}</p>
        </div>
        <ColorDots colorKeys={style.colors} />
      </div>

      <div className="mt-8 grid flex-1 grid-cols-2 gap-3">
        {(
          [
            ["FRONT", style.images.front],
            ["BACK", style.images.back],
          ] as const
        ).map(([label, src]) => (
          <figure key={label} className="min-w-0">
            <div className="relative aspect-[3/4] overflow-hidden bg-black/10">
              <Image src={src} alt={`${style.name} ${label.toLowerCase()}`} fill className="object-cover object-top" />
            </div>
            <figcaption className="mt-2 text-center text-[0.58rem] tracking-[0.22em] uppercase text-current/55">
              {label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-3">
        <p className="text-sm">{product ? formatInr(product.basePrice) : "Limited"}</p>
        {href ? (
          <Link
            to={href}
            className={cn(
              "text-[0.62rem] tracking-[0.22em] uppercase underline underline-offset-4",
              style.theme === "dark" ? "text-[#f4f1ea]" : "text-[#111]",
            )}
          >
            Shop the tee
          </Link>
        ) : (
          <span className="text-[0.62rem] tracking-[0.22em] uppercase text-current/50">Seeding catalog</span>
        )}
      </div>
    </article>
  );
}
