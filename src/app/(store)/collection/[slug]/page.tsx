import { redirect } from "next/navigation";

export default async function CollectionRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "the-builder" || slug === "drop-001") {
    redirect("/drop-001");
  }
  redirect(`/products?collection=${encodeURIComponent(slug)}`);
}
