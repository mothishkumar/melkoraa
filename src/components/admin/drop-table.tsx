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
import { archiveAdminDropRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { PublicDropSummary } from "@/types/catalog";

export function DropTable({ drops }: { drops: PublicDropSummary[] }) {
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
              <TableHead>Drop</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Limited</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {drops.map((drop) => (
              <TableRow key={drop.id}>
                <TableCell>
                  <Link href={`/admin/drops/${drop.id}`} className="font-medium hover:underline">
                    {drop.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{drop.slug}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{drop.status}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {drop.startAt ? new Date(drop.startAt).toLocaleString("en-IN") : "—"}
                </TableCell>
                <TableCell>{drop.isLimited ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  {canMutate && drop.status !== "archived" ? (
                    <ConfirmAction
                      label="Archive"
                      title="Archive this drop?"
                      description="The drop will be archived through DELETE /api/v1/admin/drops/:id. Associated products stay in the catalog."
                      confirmLabel="Archive drop"
                      variant="destructive"
                      onConfirm={async () => {
                        try {
                          await archiveAdminDropRequest(drop.id);
                          router.refresh();
                        } catch (error) {
                          setNotice(userFacingApiMessage(error));
                        }
                      }}
                    />
                  ) : (
                    <Link href={`/admin/drops/${drop.id}`} className="text-sm hover:underline">
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
