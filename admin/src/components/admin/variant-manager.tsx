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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAccess } from "@/features/admin/access";
import {
  createAdminVariantRequest,
  deactivateAdminVariantRequest,
  updateAdminVariantRequest,
} from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { formatInr } from "@/lib/catalog/money";
import { createVariantSchema, updateVariantSchema } from "@/lib/validation/catalog";
import type { AdminProductDetail } from "@/types/catalog";

export function VariantManager({ product }: { product: AdminProductDetail }) {
  const { refresh } = useAdminRefresh();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<AdminProductDetail["variants"][number] | null>(null);

  async function create(form: FormData) {
    setPending(true);
    setNotice(null);
    const parsed = createVariantSchema.safeParse({
      sku: form.get("sku"),
      size: form.get("size"),
      color: form.get("color"),
      colorCode: String(form.get("colorCode") || "") || null,
      price: form.get("price"),
      compareAtPrice: String(form.get("compareAtPrice") || "") || null,
      barcode: String(form.get("barcode") || "") || null,
    });
    if (!parsed.success) {
      setNotice("SKU, size, color, and price are required.");
      setPending(false);
      return;
    }
    try {
      await createAdminVariantRequest(product.id, parsed.data);
      refresh();
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function save(variant: AdminProductDetail["variants"][number], form: FormData) {
    setPending(true);
    setNotice(null);
    const parsed = updateVariantSchema.safeParse({
      sku: form.get("sku"),
      size: form.get("size"),
      color: form.get("color"),
      colorCode: String(form.get("colorCode") || "") || null,
      price: form.get("price"),
      compareAtPrice: String(form.get("compareAtPrice") || "") || null,
      barcode: String(form.get("barcode") || "") || null,
      isActive: form.get("isActive") === "on",
    });
    if (!parsed.success) {
      setNotice("Check the variant fields and try again.");
      setPending(false);
      return;
    }
    try {
      await updateAdminVariantRequest(product.id, variant.id, parsed.data);
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                <TableCell>{variant.size}</TableCell>
                <TableCell>{variant.color}</TableCell>
                <TableCell>{formatInr(variant.price)}</TableCell>
                <TableCell>{variant.available ? "Yes" : "No"}</TableCell>
                <TableCell>{variant.isActive ? "Yes" : "No"}</TableCell>
                <TableCell>
                  {canMutate ? (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditing(variant)}>
                        Edit
                      </Button>
                      {variant.isActive ? (
                        <ConfirmAction
                          label="Deactivate"
                          title="Deactivate this variant?"
                          description="The variant will no longer be purchasable. Inventory is not deleted."
                          onConfirm={async () => {
                            try {
                              await deactivateAdminVariantRequest(product.id, variant.id);
                              refresh();
                            } catch (error) {
                              setNotice(userFacingApiMessage(error));
                            }
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {canMutate ? (
        <form
          className="grid gap-2 sm:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await create(new FormData(event.currentTarget));
            event.currentTarget.reset();
          }}
        >
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" className="rounded-none" required />
          </div>
          <div>
            <Label htmlFor="size">Size</Label>
            <Input id="size" name="size" className="rounded-none" required />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" className="rounded-none" required />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" name="price" type="number" min="0" step="0.01" className="rounded-none" required />
          </div>
          <div>
            <Label htmlFor="colorCode">Color hex</Label>
            <Input id="colorCode" name="colorCode" className="rounded-none" placeholder="#000000" />
          </div>
          <div>
            <Label htmlFor="compareAtPrice">Compare-at</Label>
            <Input id="compareAtPrice" name="compareAtPrice" type="number" min="0" step="0.01" className="rounded-none" />
          </div>
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" name="barcode" className="rounded-none" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              Add variant
            </Button>
          </div>
        </form>
      ) : null}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit variant</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await save(editing, new FormData(event.currentTarget));
              }}
            >
              <div>
                <Label htmlFor="edit-sku">SKU</Label>
                <Input id="edit-sku" name="sku" defaultValue={editing.sku} className="mt-1 rounded-none" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-size">Size</Label>
                  <Input id="edit-size" name="size" defaultValue={editing.size} className="mt-1 rounded-none" required />
                </div>
                <div>
                  <Label htmlFor="edit-color">Color</Label>
                  <Input id="edit-color" name="color" defaultValue={editing.color} className="mt-1 rounded-none" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-price">Price</Label>
                  <Input id="edit-price" name="price" type="number" min="0" step="0.01" defaultValue={editing.price} className="mt-1 rounded-none" required />
                </div>
                <div>
                  <Label htmlFor="edit-compare-at-price">Compare-at price</Label>
                  <Input id="edit-compare-at-price" name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={editing.compareAtPrice ?? ""} className="mt-1 rounded-none" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-color-code">Color hex</Label>
                  <Input id="edit-color-code" name="colorCode" defaultValue={editing.colorCode ?? ""} className="mt-1 rounded-none" />
                </div>
                <div>
                  <Label htmlFor="edit-barcode">Barcode</Label>
                  <Input id="edit-barcode" name="barcode" defaultValue={editing.barcode ?? ""} className="mt-1 rounded-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked={editing.isActive} />
                Active and purchasable
              </label>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save variant"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
