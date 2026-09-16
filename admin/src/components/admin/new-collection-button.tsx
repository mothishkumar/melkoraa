"use client";

import { useState } from "react";

import { CollectionForm } from "@/components/admin/collection-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminAccess } from "@/features/admin/access";

export function NewCollectionButton() {
  const { canMutate } = useAdminAccess();
  const [open, setOpen] = useState(false);
  if (!canMutate) return null;
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        New collection
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
          </DialogHeader>
          <CollectionForm onSaved={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
