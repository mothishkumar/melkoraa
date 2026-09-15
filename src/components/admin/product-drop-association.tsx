"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/features/admin/access";
import { associateAdminDropProductRequest, dissociateAdminDropProductRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { PublicDropSummary } from "@/types/catalog";

export function ProductDropAssociation({
  productId,
  currentDrop,
  drops,
}: {
  productId: string;
  currentDrop: PublicDropSummary | null;
  drops: PublicDropSummary[];
}) {
  const router = useRouter();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [dropId, setDropId] = useState(currentDrop?.id ?? drops[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  async function associate() {
    if (!dropId) return;
    setPending(true);
    setNotice(null);
    try {
      await associateAdminDropProductRequest(dropId, { productId, displayOrder: 0 });
      router.refresh();
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <AdminNotice message={notice} tone="error" />
      <p className="text-sm text-muted-foreground">
        Current drop: {currentDrop ? `${currentDrop.name} (${currentDrop.slug})` : "none"}
      </p>
      <p className="text-xs text-muted-foreground">
        Collections have no product join table. Public `?collection=` filters products in an active drop.
      </p>
      {canMutate ? (
        <div className="flex flex-wrap gap-2">
          <select
            className="h-8 min-w-[12rem] flex-1 border border-input bg-transparent px-2 text-sm"
            value={dropId}
            onChange={(event) => setDropId(event.target.value)}
          >
            {drops.map((drop) => (
              <option key={drop.id} value={drop.id}>
                {drop.name} ({drop.status})
              </option>
            ))}
          </select>
          <Button type="button" disabled={pending || !dropId} onClick={associate}>
            {pending ? "Saving…" : "Associate"}
          </Button>
          {currentDrop ? (
            <ConfirmAction
              label="Remove"
              title="Remove this product from its drop?"
              description="This only removes the drop_products row."
              confirmLabel="Remove association"
              variant="destructive"
              onConfirm={async () => {
                try {
                  await dissociateAdminDropProductRequest(currentDrop.id, productId);
                  router.refresh();
                } catch (error) {
                  setNotice(userFacingApiMessage(error));
                }
              }}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Staff have read-only access.</p>
      )}
    </div>
  );
}
