import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { LookbookCard } from "@/components/product/lookbook-card";
import { fetchDrop, fetchProducts } from "@/lib/api/catalog";
import { brand } from "@/lib/brand";
import { DROP_001_PRODUCTS } from "@/lib/catalog/drop-001";
import type { ProductListItem } from "@/types/catalog";

export function DropPage() {
  const [dropName, setDropName] = useState<string>(brand.drop.label);
  const [dropDescription, setDropDescription] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetchDrop("drop-001")
        .then((drop) => {
          setDropName(drop.name);
          setDropDescription(drop.description ?? null);
        })
        .catch(() => undefined),
      fetchProducts({ drop: "drop-001", pageSize: "20" })
        .then((result) => setProducts(result.data))
        .catch(() => setProducts([])),
    ]).finally(() => setLoading(false));
  }, []);

  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const identity = DROP_001_PRODUCTS.filter((style) => style.line === "identity");
  const manifesto = DROP_001_PRODUCTS.filter((style) => style.line === "manifesto");

  if (loading) {
    return <div className="min-h-[50vh] bg-[#0c0c0c]" />;
  }

  return (
    <div className="bg-[#0c0c0c] text-[#f4f1ea]">
      <header className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
        <div className="flex items-start justify-between gap-6 text-[0.62rem] tracking-[0.28em] uppercase text-[#a6a29a]">
          <p>
            Wear a higher
            <br />
            standard
          </p>
          <p className="text-right">
            People ideas
            <br />
            progress together
          </p>
        </div>
        <p className="label-caps mt-12 text-center text-[#a6a29a]">Limited release · never restocked</p>
        <h1 className="editorial-display mt-4 text-center text-5xl text-[#f4f1ea] md:text-7xl">{brand.drop.code}</h1>
        <p className="mt-3 text-center font-heading text-xl tracking-[0.28em] uppercase text-[#f4f1ea]/75">{dropName}</p>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-[#a6a29a]">
          {dropDescription ?? "Identity trio. Manifesto graphics. Production ready."}
        </p>
      </header>

      <section>
        <div className="border-y border-white/10 px-4 py-4 md:px-8">
          <p className="text-center text-[0.62rem] tracking-[0.32em] uppercase text-[#a6a29a]">01–03 Identity</p>
        </div>
        <div className="grid lg:grid-cols-3">
          {identity.map((style) => (
            <LookbookCard key={style.slug} style={style} product={bySlug.get(style.slug)} />
          ))}
        </div>
      </section>

      <section className="mt-0">
        <div className="border-y border-white/10 px-4 py-4 md:px-8">
          <p className="text-center text-[0.62rem] tracking-[0.32em] uppercase text-[#a6a29a]">04–06 Manifesto</p>
        </div>
        <div className="grid lg:grid-cols-3">
          {manifesto.map((style) => (
            <LookbookCard key={style.slug} style={style} product={bySlug.get(style.slug)} />
          ))}
        </div>
      </section>

      <section className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Premium oversized fit", "240 GSM cotton"],
          ["Embroidery detail", "Left-chest mark"],
          ["Signature tag", "Woven neck label"],
          ["High quality print", "Screen, not DTG"],
          ["It's a mindset", "Wear the change"],
        ].map(([title, body]) => (
          <div key={title} className="bg-[#0c0c0c] px-5 py-8 text-center">
            <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[#f4f1ea]">{title}</p>
            <p className="mt-2 text-[0.65rem] tracking-[0.12em] uppercase text-[#a6a29a]">{body}</p>
          </div>
        ))}
      </section>

      <div className="flex justify-center px-4 py-14">
        <Link to="/" className="mk-outline border-[#f4f1ea] text-[#f4f1ea] hover:bg-[#f4f1ea] hover:text-black">
          Back to home
        </Link>
      </div>
    </div>
  );
}
