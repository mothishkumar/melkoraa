import { brand } from "@/lib/brand";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[720px] px-4 py-20 md:px-8 md:py-28">
      <p className="label-caps">{brand.name}</p>
      <h1 className="editorial-display mt-4 text-4xl">Privacy</h1>
      <p className="mt-8 text-sm leading-7 text-stone">
        This page is a placeholder. A full privacy notice will be published with the public drop. We
        do not invent legal policies here.
      </p>
    </article>
  );
}
