"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminNotice } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAccess } from "@/features/admin/access";
import { archiveAdminProductRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { formatInr } from "@/lib/catalog/money";
import type { AdminProductListItem } from "@/types/catalog";

export function ProductTable({ products }: { products: AdminProductListItem[] }) {
  const router = useRouter();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <AdminNotice message={notice} tone="error" />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.primaryImage?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.primaryImage.url}
                        alt={product.primaryImage.alt || product.name}
                        className="size-10 object-cover"
                      />
                    ) : (
                      <div className="size-10 bg-white/10" />
                    )}
                    <div>
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {product.categories.map((category) => category.name).join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{product.slug}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.status}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{formatInr(product.basePrice)}</TableCell>
                <TableCell>{product.variantCount}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(product.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell className="text-right">
                  {canMutate && product.status !== "archived" ? (
                    <ConfirmAction
                      label="Archive"
                      title="Archive this product?"
                      description="The product will no longer appear in the public catalog. This uses the existing archive API."
                      confirmLabel="Archive product"
                      variant="destructive"
                      onConfirm={async () => {
                        try {
                          await archiveAdminProductRequest(product.id);
                          router.refresh();
                        } catch (error) {
                          setNotice(userFacingApiMessage(error));
                        }
                      }}
                    />
                  ) : (
                    <Link href={`/admin/products/${product.id}`} className="text-sm hover:underline">
                      View
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
