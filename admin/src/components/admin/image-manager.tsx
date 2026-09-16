"use client";

import { useNavigate } from "react-router-dom"
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { useState } from "react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAccess } from "@/features/admin/access";
import {
  deleteAdminProductImageRequest,
  updateAdminProductImageRequest,
  uploadAdminProductImageRequest,
} from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { AdminProductDetail } from "@/types/catalog";

export function ImageManager({ product }: { product: AdminProductDetail }) {
  const navigate = useNavigate()
  const { refresh } = useAdminRefresh();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-4">
      <AdminNotice message={notice} tone="error" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {product.images.map((image) => (
          <figure key={image.id} className="border border-white/10 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt || product.name} className="aspect-[3/4] w-full object-cover" />
            <figcaption className="mt-2 text-xs text-muted-foreground">
              {image.imageType} · {image.sortOrder}
            </figcaption>
            {canMutate ? (
              <div className="mt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={image.imageType === "primary"}
                  onClick={async () => {
                    try {
                      await updateAdminProductImageRequest(product.id, image.id, {
                        imageType: "primary",
                        sortOrder: 0,
                      });
                      refresh();
                    } catch (error) {
                      setNotice(userFacingApiMessage(error));
                    }
                  }}
                >
                  Set primary
                </Button>
                <ConfirmAction
                  label="Delete"
                  title="Delete this image?"
                  description="The file will be removed from storage via the existing image API."
                  variant="destructive"
                  onConfirm={async () => {
                    await deleteAdminProductImageRequest(product.id, image.id);
                    refresh();
                  }}
                />
              </div>
            ) : null}
          </figure>
        ))}
      </div>
      {canMutate ? (
        <form
          className="max-w-md space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const file = data.get("file");
            if (!(file instanceof File) || file.size === 0) {
              setNotice("Choose a JPEG, PNG, or WebP image under 5MB.");
              return;
            }
            const allowed = ["image/jpeg", "image/png", "image/webp"];
            if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
              setNotice("Choose a JPEG, PNG, or WebP image under 5MB.");
              return;
            }
            setPending(true);
            setNotice(null);
            try {
              await uploadAdminProductImageRequest(product.id, data);
              form.reset();
              refresh();
            } catch (error) {
              setNotice(userFacingApiMessage(error));
            } finally {
              setPending(false);
            }
          }}
        >
          <div>
            <Label htmlFor="file">Upload image</Label>
            <Input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 rounded-none" />
          </div>
          <div>
            <Label htmlFor="altText">Alt text</Label>
            <Input id="altText" name="altText" className="mt-1 rounded-none" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
