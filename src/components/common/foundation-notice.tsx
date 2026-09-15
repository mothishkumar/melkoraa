import Link from "next/link";

export function FoundationNotice({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="border border-white/10 px-6 py-10 md:px-10">
      <p className="label-caps">Foundation</p>
      <h1 className="editorial-display mt-4 text-3xl md:text-5xl">{title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-8 inline-flex border border-off-white px-6 py-3 text-[0.65rem] tracking-[0.22em] uppercase transition-colors hover:bg-off-white hover:text-black"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
