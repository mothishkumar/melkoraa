"use client";

import { useNavigate } from "react-router-dom"
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { useState } from "react";

import { StatusPill } from "@/components/admin/status-pill";
import { CollectionForm } from "@/components/admin/collection-form";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAccess } from "@/features/admin/access";
import { archiveAdminCollectionRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { PublicCollection } from "@/types/catalog";

export function CollectionTable({ collections }: { collections: PublicCollection[] }) {
  const navigate = useNavigate()
  const { refresh } = useAdminRefresh();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<PublicCollection | null>(null);

  return (
    <div className="space-y-3">
      <AdminNotice message={notice} tone="error" />
      <div className="admin-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collection</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell className="font-medium">{collection.name}</TableCell>
                <TableCell className="font-mono text-xs">{collection.slug}</TableCell>
                <TableCell>
                  <StatusPill value={collection.status} />
                </TableCell>
                <TableCell className="space-x-2 text-right whitespace-nowrap">
                  {canMutate ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => setEditing(collection)}>
                        Edit
                      </Button>
                      {collection.status !== "archived" ? (
                        <ConfirmAction
                          label="Archive"
                          title="Archive this collection?"
                          description="The collection will be archived through DELETE /api/v1/admin/collections/:id. There is no product join table, so this does not detach products."
                          confirmLabel="Archive collection"
                          variant="destructive"
                          onConfirm={async () => {
                            try {
                              await archiveAdminCollectionRequest(collection.id);
                              refresh();
                            } catch (error) {
                              setNotice(userFacingApiMessage(error));
                            }
                          }}
                        />
                      ) : null}
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
          </DialogHeader>
          {editing ? <CollectionForm collection={editing} onSaved={() => setEditing(null)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
