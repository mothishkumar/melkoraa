import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { DropForm } from "@/components/admin/drop-form";
import { DropProductManager } from "@/components/admin/drop-product-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { getAdminDropRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { PublicDropSummary } from "@/types/catalog";

type AdminDropDetail = PublicDropSummary & {
  products: { id: string; name: string; slug: string; status: string; displayOrder: number }[];
};

export function DropDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tick } = useAdminRefresh();
  const [drop, setDrop] = useState<AdminDropDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void getAdminDropRequest(id)
      .then((data) => {
        if (!cancelled) {
          setDrop(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(userFacingApiMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading drop…</p>;
  if (error || !drop) return <p className="text-sm text-destructive">{error ?? "Drop not found."}</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader title={drop.name} description={drop.slug} action={<Badge variant="secondary">{drop.status}</Badge>} />
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
