import { notFound } from "next/navigation";

import { DropForm } from "@/components/admin/drop-form";
import { DropProductManager } from "@/components/admin/drop-product-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { requireStaff } from "@/lib/auth/require-role";
import { getAdminDrop } from "@/server/services/catalog/drop-service";

export const metadata = { title: "Drop" };

export default async function AdminDropDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  let drop;
  try {
    drop = await getAdminDrop(id);
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!drop) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader
        title={drop.name}
        description={drop.slug}
        action={<Badge variant="secondary">{drop.status}</Badge>}
      />
      <section className="max-w-xl">
        <h2 className="mb-3 text-sm font-medium">Drop information</h2>
        <DropForm drop={drop} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-medium">Products</h2>
        <DropProductManager dropId={drop.id} products={drop.products} />
      </section>
    </div>
  );
}
