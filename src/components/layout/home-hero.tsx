"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { brand } from "@/lib/brand";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] grid-cols-1 md:grid-cols-12">
        <div className="flex flex-col justify-end border-b border-white/10 px-4 py-16 md:col-span-7 md:border-b-0 md:border-r md:px-8 md:py-24">
          <motion.p
            className="label-caps"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {brand.name}
          </motion.p>
          <motion.h1
            className="editorial-display mt-8 max-w-[12ch] text-[clamp(2.8rem,9vw,8rem)] leading-[0.9]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          >
            BUILD YOUR
            <br />
            OWN IDENTITY.
          </motion.h1>
          <motion.p
            className="mt-10 text-sm tracking-[0.2em] text-stone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {brand.drop.label}
          </motion.p>
        </div>
        <div className="flex flex-col justify-between px-4 py-16 md:col-span-5 md:px-10 md:py-24">
          <p className="max-w-[16ch] font-heading text-3xl leading-tight md:text-5xl">
            {brand.drop.message}
          </p>
          <div className="mt-16 space-y-8">
            <p className="max-w-sm text-sm leading-7 text-stone">{brand.copy.path}</p>
            <Link
              href="/shop"
              className="inline-flex w-fit border border-off-white px-8 py-4 text-[0.7rem] tracking-[0.28em] uppercase transition-colors hover:bg-off-white hover:text-black"
            >
              SHOP DROP 001
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
