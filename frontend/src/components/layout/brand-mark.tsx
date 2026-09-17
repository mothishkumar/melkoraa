import { Link } from "react-router-dom";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({
  href = "/",
  className,
  invert = false,
}: {
  href?: string;
  className?: string;
  invert?: boolean;
}) {
  const mark = (
    <span
      className={cn(
        "editorial-display inline-block max-w-full shrink-0 tracking-[0.28em] text-current md:tracking-[0.42em]",
        invert ? "text-[#111]" : "text-off-white",
        className,
      )}
    >
      {brand.name}
    </span>
  );

  if (!href) return mark;

  return (
    <Link to={href} aria-label={brand.name} className="inline-flex min-w-0 items-center">
      {mark}
    </Link>
  );
}
