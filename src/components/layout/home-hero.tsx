"use client";

import Image from "next/image";
import Link from "next/link";

import { brand } from "@/lib/brand";
import type { ProductListItem } from "@/types/catalog";

export function HomeHero({ products = [] }: { products?: ProductListItem[] }) {
  const backdrop = products.find((product) => product.primaryImage?.url)?.primaryImage;

  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-black">
      {backdrop?.url ? (
        <Image
          src={backdrop.url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(120,110,90,0.28), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.82) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1600px] flex-col justify-between px-4 py-10 md:px-8 md:py-14">
        <div className="flex items-start justify-between text-[0.62rem] tracking-[0.28em] uppercase text-stone">
          <p className="hidden max-w-[10rem] leading-5 md:block">
            Individuality
            <br />
            Transformation
            <br />
            Elevation
          </p>
          <p className="ml-auto hidden text-right md:block">
            More than
            <br />
            clothing
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="editorial-display text-sm tracking-[0.5em] text-off-white/80">
            {brand.name}
          </p>
          <h1 className="editorial-display mt-6 max-w-[16ch] text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.92] text-off-white">
            {brand.drop.code}
            <span className="mt-3 block text-[0.38em] tracking-[0.42em] text-off-white/80">
              {brand.drop.name}
            </span>
          </h1>
          <p className="mt-6 text-[0.7rem] tracking-[0.32em] text-stone uppercase">
            Four stories. One higher tomorrow.
          </p>
          <Link
            href="/drop-001"
            className="mk-outline mt-10 border-off-white text-off-white hover:bg-off-white hover:text-black"
          >
            Shop {brand.drop.code}
          </Link>
        </div>

        <p className="text-center text-[0.62rem] tracking-[0.22em] uppercase text-stone">Est. 2024</p>
      </div>
    </section>
  );
}
