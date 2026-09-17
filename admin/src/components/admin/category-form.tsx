import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminNotice } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccess } from "@/features/admin/access";
import {
  createAdminCategoryRequest,
  updateAdminCategoryRequest,
} from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { createCategorySchema } from "@/lib/validation/catalog";
import type { PublicCategory } from "@/types/catalog";

const formSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CategoryForm({
  category,
  onSaved,
}: {
  category?: PublicCategory;
  onSaved?: () => void;
}) {
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setNotice(null);
    const parsed = createCategorySchema.safeParse({
      ...values,
      description: values.description || null,
    });
    if (!parsed.success) {
      setNotice("Check the category fields and try again.");
      return;
    }

    try {
      if (category) {
        await updateAdminCategoryRequest(category.id, parsed.data);
      } else {
        await createAdminCategoryRequest(parsed.data);
      }
      onSaved?.();
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <AdminNotice message={notice} tone="error" />
      <div>
        <Label htmlFor="category-name">Name</Label>
        <Input id="category-name" className="mt-1 rounded-none" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="category-slug">Slug</Label>
        <Input id="category-slug" className="mt-1 rounded-none font-mono" {...form.register("slug")} />
      </div>
      <div>
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          className="mt-1 rounded-none"
          rows={3}
          {...form.register("description")}
        />
      </div>
      <Button type="submit" disabled={!canMutate || form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : category ? "Save category" : "Create category"}
      </Button>
    </form>
  );
}
