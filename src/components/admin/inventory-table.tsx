"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { adjustAdminInventoryRequest, getAdminInventoryRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { adjustInventorySchema } from "@/lib/validation/inventory";
import type { InventoryDetail, InventoryListItem } from "@/types/inventory";

export function InventoryTable({ rows }: { rows: InventoryListItem[] }) {
  const router = useRouter();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [detail, setDetail] = useState<InventoryDetail | null>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ delta: number; notes: string | null } | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-3">
      <AdminNotice message={notice} tone="error" />
      <div className="admin-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.variantId} className={row.available <= row.reorderLevel ? "bg-amber-50/80" : undefined}>
                <TableCell>{row.productName}</TableCell>
                <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                <TableCell>
                  {row.size} / {row.color}
                </TableCell>
                <TableCell className="tabular-nums">{row.available}</TableCell>
                <TableCell className="tabular-nums">{row.onHand}</TableCell>
                <TableCell className="tabular-nums">{row.reserved}</TableCell>
                <TableCell className="tabular-nums">{row.sold}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(row.updatedAt).toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        setDetail(await getAdminInventoryRequest(row.variantId));
                      } catch (error) {
                        setNotice(userFacingApiMessage(error));
                      }
                    }}
                  >
                    Ledger
                  </Button>
                  {canMutate ? (
                    <Button type="button" variant="outline" onClick={() => setAdjustId(row.variantId)}>
                      Adjust
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inventory ledger</DialogTitle>
          </DialogHeader>
          {(detail?.recentTransactions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No ledger rows for this variant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {detail?.recentTransactions.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-3 border-b border-white/10 py-2">
                  <span>
                    {new Date(entry.createdAt).toLocaleString("en-IN")}
                    <span className="mt-1 block">{entry.type}</span>
                    {entry.notes ? <span className="block text-xs text-muted-foreground">{entry.notes}</span> : null}
                  </span>
                  <span className="tabular-nums">{entry.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(adjustId)}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustId(null);
            setPreview(null);
          }
        }}
      >
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust on-hand</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <p className="text-sm">
                Apply a delta of <strong>{preview.delta}</strong>
                {preview.notes ? ` (${preview.notes})` : ""}. On-hand will change; reserved and sold will not.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={async () => {
                    if (!adjustId) return;
                    setPending(true);
                    try {
                      await adjustAdminInventoryRequest(adjustId, {
                        delta: preview.delta,
                        notes: preview.notes,
                        referenceType: "admin_adjustment",
                      });
                      setAdjustId(null);
                      setPreview(null);
                      router.refresh();
                    } catch (error) {
                      setNotice(userFacingApiMessage(error));
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  {pending ? "Applying…" : "Confirm adjustment"}
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const parsed = adjustInventorySchema.safeParse({
                  delta: Number(data.get("delta")),
                  notes: String(data.get("notes") || "") || null,
                  referenceType: "admin_adjustment",
                });
                if (!parsed.success) {
                  setNotice("Enter a non-zero integer delta.");
                  return;
                }
                setPreview({ delta: parsed.data.delta, notes: parsed.data.notes ?? null });
              }}
            >
              <p className="text-sm text-muted-foreground">
                Posts to POST /api/v1/admin/inventory/:variantId/adjust. Negative resulting stock is rejected by the server.
              </p>
              <div>
                <Label htmlFor="delta">Delta</Label>
                <Input id="delta" name="delta" type="number" required className="mt-1 rounded-none" />
              </div>
              <div>
                <Label htmlFor="notes">Reason</Label>
                <Input id="notes" name="notes" className="mt-1 rounded-none" />
              </div>
              <Button type="submit">Review adjustment</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
