"use client";

import { useNavigate } from "react-router-dom"
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { useState } from "react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
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
import { createVariantSchema } from "@/lib/validation/catalog";
import type { AdminProductDetail } from "@/types/catalog";

export function VariantManager({ product }: { product: AdminProductDetail }) {
  const navigate = useNavigate()
  const { refresh } = useAdminRefresh();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function create(form: FormData) {
    setPending(true);
    setNotice(null);
    const parsed = createVariantSchema.safeParse({
      sku: form.get("sku"),
      size: form.get("size"),
      color: form.get("color"),
      price: form.get("price"),
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
                    <ConfirmAction
                      label="Deactivate"
                      title="Deactivate this variant?"
                      description="The variant will no longer be purchasable. Inventory is not deleted."
                      onConfirm={async () => {
                        await deactivateAdminVariantRequest(product.id, variant.id);
                        refresh();
                      }}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {canMutate ? (
        <form
          className="grid gap-2 sm:grid-cols-5"
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
            <Input id="price" name="price" className="rounded-none" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              Add variant
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export { updateAdminVariantRequest };
