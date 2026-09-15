import Link from "next/link";

import type { PublicCategory } from "@/types/catalog";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;

export function ProductFilters({
  categories,
  current,
  basePath,
}: {
  categories: PublicCategory[];
  current: {
    category?: string;
    sort?: string;
    drop?: string;
    collection?: string;
    search?: string;
    isNew?: string;
  };
  basePath: string;
}) {
  const hrefFor = (patch: Record<string, string | undefined>) => {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="flex flex-col gap-6 border-b border-white/10 py-6 md:flex-row md:flex-wrap md:items-end md:justify-between">
      <div className="flex flex-wrap gap-2">
        <Link
          href={hrefFor({ category: undefined })}
          className={`label-caps border px-3 py-2 text-[0.6rem] ${
            !current.category ? "border-off-white text-off-white" : "border-white/15 text-stone"
          }`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={hrefFor({ category: category.slug })}
            className={`label-caps border px-3 py-2 text-[0.6rem] ${
              current.category === category.slug
                ? "border-off-white text-off-white"
                : "border-white/15 text-stone"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
      <form action={basePath} className="flex flex-wrap gap-3">
        {current.drop ? <input type="hidden" name="drop" value={current.drop} /> : null}
        {current.collection ? <input type="hidden" name="collection" value={current.collection} /> : null}
        {current.category ? <input type="hidden" name="category" value={current.category} /> : null}
        <label className="sr-only" htmlFor="search">
          Search
        </label>
        <input
          id="search"
          name="search"
          defaultValue={current.search}
          placeholder="Search"
          className="h-10 w-40 border border-white/15 bg-transparent px-3 text-sm"
        />
        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={current.sort ?? "newest"}
          className="h-10 border border-white/15 bg-black px-3 text-sm"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
        <button type="submit" className="label-caps h-10 border border-off-white px-4 text-[0.6rem]">
          Apply
        </button>
      </form>
    </div>
  );
}
