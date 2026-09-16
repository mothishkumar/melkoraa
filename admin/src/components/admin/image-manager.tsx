import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { useState } from "react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAccess } from "@/features/admin/access";
import {
  deleteAdminProductImageRequest,
  updateAdminProductImageRequest,
  uploadAdminProductImageRequest,
} from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { updateImageSchema } from "@/lib/validation/catalog";
import type { AdminProductDetail } from "@/types/catalog";

export function ImageManager({ product }: { product: AdminProductDetail }) {
  const { refresh } = useAdminRefresh();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<AdminProductDetail["images"][number] | null>(null);

  async function saveMetadata(image: AdminProductDetail["images"][number], form: FormData) {
    const parsed = updateImageSchema.safeParse({
      altText: String(form.get("altText") || "") || null,
      sortOrder: Number(form.get("sortOrder")),
      imageType: form.get("imageType"),
      variantId: String(form.get("variantId") || "") || null,
    });
    if (!parsed.success) {
      setNotice("Check the image fields and try again.");
      return;
    }
    setPending(true);
    setNotice(null);
    try {
      await updateAdminProductImageRequest(product.id, image.id, parsed.data);
      setEditing(null);
      refresh();
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminNotice message={notice} tone="error" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {product.images.map((image) => (
          <figure key={image.id} className="border border-white/10 p-2">
            <img src={image.url} alt={image.alt || product.name} className="aspect-[3/4] w-full object-cover" />
            <figcaption className="mt-2 text-xs text-muted-foreground">
              {image.imageType} · {image.sortOrder}
            </figcaption>
            {canMutate ? (
              <div className="mt-2 flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(image)}>
                  Edit details
                </Button>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="imageType">Image type</Label>
              <select id="imageType" name="imageType" defaultValue="secondary" className="mt-1 h-9 w-full rounded-none border border-input bg-transparent px-2 text-sm">
                <option value="secondary">secondary</option>
                <option value="primary">primary</option>
                <option value="back">back</option>
                <option value="detail">detail</option>
                <option value="lifestyle">lifestyle</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Display order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" min="0" max="1000" defaultValue="0" className="mt-1 rounded-none" />
            </div>
          </div>
          <div>
            <Label htmlFor="variantId">Variant (optional)</Label>
            <select id="variantId" name="variantId" defaultValue="" className="mt-1 h-9 w-full rounded-none border border-input bg-transparent px-2 text-sm">
              <option value="">Product image</option>
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>{variant.sku} · {variant.size} / {variant.color}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      ) : null}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit image details</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await saveMetadata(editing, new FormData(event.currentTarget));
              }}
            >
              <div>
                <Label htmlFor="edit-alt-text">Alt text</Label>
                <Input id="edit-alt-text" name="altText" defaultValue={editing.alt ?? ""} className="mt-1 rounded-none" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-image-type">Image type</Label>
                  <select id="edit-image-type" name="imageType" defaultValue={editing.imageType} className="mt-1 h-9 w-full rounded-none border border-input bg-transparent px-2 text-sm">
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                    <option value="back">back</option>
                    <option value="detail">detail</option>
                    <option value="lifestyle">lifestyle</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-sort-order">Display order</Label>
                  <Input id="edit-sort-order" name="sortOrder" type="number" min="0" max="1000" defaultValue={editing.sortOrder} className="mt-1 rounded-none" required />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-variant-id">Variant</Label>
                <select id="edit-variant-id" name="variantId" defaultValue={editing.variantId ?? ""} className="mt-1 h-9 w-full rounded-none border border-input bg-transparent px-2 text-sm">
                  <option value="">Product image</option>
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.sku} · {variant.size} / {variant.color}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save image"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
