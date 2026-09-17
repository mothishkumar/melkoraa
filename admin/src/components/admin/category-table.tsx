import { useState } from "react";

import { CategoryForm } from "@/components/admin/category-form";
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
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import { deleteAdminCategoryRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/permissions";
import type { PublicCategory } from "@/types/catalog";

export function CategoryTable({ categories }: { categories: PublicCategory[] }) {
  const { role, canMutate } = useAdminAccess();
  const { refresh } = useAdminRefresh();
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<PublicCategory | null>(null);

  return (
    <div className="space-y-3">
      <AdminNotice message={notice} tone="error" />
      <div className="admin-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="font-mono text-xs">{category.slug}</TableCell>
                <TableCell className="max-w-[24rem] truncate text-muted-foreground">
                  {category.description ?? "—"}
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap text-right">
                  {canMutate ? (
                    <Button type="button" variant="outline" onClick={() => setEditing(category)}>
                      Edit
                    </Button>
                  ) : null}
                  {isAdmin(role) ? (
                    <ConfirmAction
                      label="Delete"
                      title="Delete this category?"
                      description="Categories assigned to products cannot be deleted. This action cannot be undone."
                      confirmLabel="Delete category"
                      variant="destructive"
                      onConfirm={async () => {
                        try {
                          await deleteAdminCategoryRequest(category.id);
                          setNotice(null);
                          refresh();
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
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          {editing ? (
            <CategoryForm
              category={editing}
              onSaved={() => {
                setEditing(null);
                refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
