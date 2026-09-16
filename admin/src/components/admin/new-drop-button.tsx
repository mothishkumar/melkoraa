"use client";

import { useState } from "react";

import { DropForm } from "@/components/admin/drop-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminAccess } from "@/features/admin/access";

export function NewDropButton() {
  const { canMutate } = useAdminAccess();
  const [open, setOpen] = useState(false);
  if (!canMutate) return null;
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        New drop
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New drop</DialogTitle>
          </DialogHeader>
          <DropForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
