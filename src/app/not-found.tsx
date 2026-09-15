import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-6 py-24 text-center text-off-white">
      <p className="label-caps">404</p>
      <h1 className="editorial-display mt-6 text-5xl">Page not found</h1>
      <Link
        href="/"
        className="mt-10 border border-off-white px-8 py-3 text-[0.65rem] tracking-[0.22em] uppercase"
      >
        Home
      </Link>
    </div>
  );
}
