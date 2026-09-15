"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccess } from "@/features/admin/access";
import { createAdminCollectionRequest, updateAdminCollectionRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { createCollectionSchema } from "@/lib/validation/catalog";
import type { PublicCollection } from "@/types/catalog";

const formSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]),
  heroImageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CollectionForm({
  collection,
  onSaved,
}: {
  collection?: PublicCollection;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection?.name ?? "",
      slug: collection?.slug ?? "",
      description: collection?.description ?? "",
      status: collection?.status ?? "draft",
      heroImageUrl: collection?.heroImageUrl ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setNotice(null);
    const parsed = createCollectionSchema.safeParse({
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      status: values.status,
      heroImageUrl: values.heroImageUrl || null,
    });
    if (!parsed.success) {
      setNotice("Check the collection fields and try again.");
      return;
    }
    const payload = parsed.data;
    try {
      if (collection) {
        await updateAdminCollectionRequest(collection.id, payload);
        setNotice("Saved.");
        router.refresh();
        onSaved?.();
      } else {
        await createAdminCollectionRequest(payload);
        router.refresh();
        onSaved?.();
      }
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <AdminNotice message={notice} tone={notice === "Saved." ? "info" : "error"} />
      <div>
        <Label htmlFor="collection-name">Name</Label>
        <Input id="collection-name" className="mt-1 rounded-none" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="collection-slug">Slug</Label>
        <Input id="collection-slug" className="mt-1 rounded-none font-mono" {...form.register("slug")} />
      </div>
      <div>
        <Label htmlFor="collection-status">Status</Label>
        <select
          id="collection-status"
          className="mt-1 h-8 w-full border border-input bg-transparent px-2"
          {...form.register("status")}
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
      </div>
      <div>
        <Label htmlFor="collection-hero">Hero image URL</Label>
        <Input id="collection-hero" className="mt-1 rounded-none" {...form.register("heroImageUrl")} />
      </div>
      <div>
        <Label htmlFor="collection-description">Description</Label>
        <Textarea id="collection-description" className="mt-1 rounded-none" rows={3} {...form.register("description")} />
      </div>
      <Button type="submit" disabled={!canMutate || form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : collection ? "Save collection" : "Create collection"}
      </Button>
    </form>
  );
}
