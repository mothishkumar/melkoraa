"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { associateAdminDropProductRequest, dissociateAdminDropProductRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { dropProductSchema } from "@/lib/validation/catalog";

type DropProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  displayOrder: number;
};

export function DropProductManager({
  dropId,
  products,
}: {
  dropId: string;
  products: DropProduct[];
}) {
  const router = useRouter();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [pending, setPending] = useState(false);

  async function addProduct() {
    setNotice(null);
    const parsed = dropProductSchema.safeParse({
      productId,
      displayOrder: Number(displayOrder),
    });
    if (!parsed.success) {
      setNotice("Enter a valid product id and display order.");
      return;
    }
    setPending(true);
    try {
      await associateAdminDropProductRequest(dropId, parsed.data);
      setProductId("");
      router.refresh();
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminNotice message={notice} tone="error" />
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products are associated with this drop.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link href={`/admin/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.slug}</TableCell>
                  <TableCell>{product.status}</TableCell>
                  <TableCell>{product.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    {canMutate ? (
                      <ConfirmAction
                        label="Remove"
                        title="Remove this product from the drop?"
                        description="This deletes the drop_products association only. The product record is not archived."
                        confirmLabel="Remove from drop"
                        variant="destructive"
                        onConfirm={async () => {
                          try {
                            await dissociateAdminDropProductRequest(dropId, product.id);
                            router.refresh();
                          } catch (error) {
                            setNotice(userFacingApiMessage(error));
                          }
                        }}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {canMutate ? (
        <div className="grid max-w-xl gap-3 sm:grid-cols-[1fr_6rem_auto]">
          <div>
            <Label htmlFor="drop-product-id">Product id</Label>
            <Input
              id="drop-product-id"
              className="mt-1 rounded-none font-mono"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              placeholder="uuid"
            />
          </div>
          <div>
            <Label htmlFor="drop-product-order">Order</Label>
            <Input
              id="drop-product-order"
              className="mt-1 rounded-none"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" disabled={pending} onClick={addProduct}>
              {pending ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
