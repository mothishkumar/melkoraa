"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { brand } from "@/lib/brand";
import { formatInr } from "@/lib/catalog/money";
import type { ProductListItem } from "@/types/catalog";

export function HomeHero({ products = [] }: { products?: ProductListItem[] }) {
  const lineup = products.slice(0, 4);

  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(120,110,90,0.28), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)",
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
          <motion.p
            className="editorial-display text-sm tracking-[0.5em] text-off-white/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {brand.name}
          </motion.p>
          <motion.h1
            className="editorial-display mt-6 max-w-[16ch] text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.92] text-off-white"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {brand.drop.code}
            <span className="mt-3 block text-[0.38em] tracking-[0.42em] text-off-white/80">
              {brand.drop.name}
            </span>
          </motion.h1>
          <p className="mt-6 text-[0.7rem] tracking-[0.32em] text-stone uppercase">
            Four stories. One higher tomorrow.
          </p>
          <Link href="/drop-001" className="mk-outline mt-10 border-off-white text-off-white hover:bg-off-white hover:text-black">
            Shop {brand.drop.code}
          </Link>
        </div>

        {lineup.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {lineup.map((product, index) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-charcoal">
                  {product.primaryImage?.url ? (
                    <Image
                      src={product.primaryImage.url}
                      alt={product.primaryImage.alt || product.name}
                      fill
                      sizes="25vw"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      priority={index < 2}
                    />
                  ) : null}
                </div>
                <p className="mt-3 text-center text-[0.68rem] tracking-[0.18em] uppercase text-off-white/80">
                  {product.name}
                </p>
                <p className="mt-1 text-center text-xs text-stone">{formatInr(product.basePrice)}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
