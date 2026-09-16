import { Image } from "@/components/ui/image";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { PublicImage } from "@/types/catalog";

export function ProductGallery({
  images,
  productName,
}: {
  images: PublicImage[];
  productName: string;
}) {
  const usable = images.filter((image) => image.url);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const current = usable[index] ?? null;
  const broken = current ? failed[current.id] : false;

  if (!current) {
    return (
      <div className="flex aspect-[3/4] w-full items-end bg-charcoal px-6 py-8">
        <p className="editorial-display text-2xl text-stone">{productName}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-[88px_minmax(0,1fr)]">
      <div className="hidden flex-col gap-2 md:flex">
        {usable.map((image, imageIndex) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setIndex(imageIndex)}
            aria-label={`View image ${imageIndex + 1} of ${usable.length}`}
            aria-current={imageIndex === index}
            className={cn(
              "relative aspect-[3/4] overflow-hidden border",
              imageIndex === index ? "border-black" : "border-black/10",
            )}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="88px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ece8e1]">
        {broken ? (
          <div className="flex h-full items-end px-6 py-8">
            <p className="text-sm text-stone">{productName}</p>
          </div>
        ) : (
          <Image
            src={current.url}
            alt={current.alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover"
            priority
            onError={() => setFailed((prev) => ({ ...prev, [current.id]: true }))}
          />
        )}
      </div>
      {usable.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto md:hidden">
          {usable.map((image, imageIndex) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`View image ${imageIndex + 1}`}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden border",
                imageIndex === index ? "border-black" : "border-black/10",
              )}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
