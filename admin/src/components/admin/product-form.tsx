"use client";

import { useNavigate } from "react-router-dom"
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
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
import { createAdminProductRequest, updateAdminProductRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { createProductSchema } from "@/lib/validation/catalog";
import type { AdminProductDetail, PublicCategory } from "@/types/catalog";

const formSchema = createProductSchema;

export function ProductForm({
  product,
  categories,
}: {
  product?: AdminProductDetail;
  categories: PublicCategory[];
}) {
  const navigate = useNavigate()
  const { refresh } = useAdminRefresh();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      shortDescription: product?.shortDescription ?? "",
      description: product?.description ?? "",
      basePrice: product?.basePrice ?? "",
      compareAtPrice: product?.compareAtPrice ?? undefined,
      brand: product?.brand ?? "MELKORAA",
      status: product?.status ?? "draft",
      seoTitle: product?.seoTitle ?? undefined,
      seoDescription: product?.seoDescription ?? undefined,
      categoryIds: product?.categories.map((item) => item.id) ?? [],
    },
  });

  async function onSubmit(values: z.output<typeof formSchema>) {
    setNotice(null);
    const payload = {
      ...values,
      shortDescription: values.shortDescription || null,
      description: values.description || null,
      compareAtPrice: values.compareAtPrice || null,
    };
    try {
      if (product) {
        await updateAdminProductRequest(product.id, payload);
        refresh();
        setNotice("Saved.");
      } else {
        const created = await createAdminProductRequest(payload);
        navigate(`/products/${created.id}`);
      }
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <AdminNotice message={notice} tone={notice === "Saved." ? "info" : "error"} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" className="mt-1 rounded-none" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" className="mt-1 rounded-none font-mono" {...form.register("slug")} />
      </div>
      <div>
        <Label htmlFor="basePrice">Price</Label>
        <Input id="basePrice" type="number" min="0" step="0.01" className="mt-1 rounded-none" {...form.register("basePrice")} />
      </div>
      <div>
        <Label htmlFor="compareAtPrice">Compare-at price</Label>
        <Input
          id="compareAtPrice"
          type="number"
          min="0"
          step="0.01"
          className="mt-1 rounded-none"
          {...form.register("compareAtPrice")}
        />
      </div>
      <div>
        <Label htmlFor="brand">Brand</Label>
        <Input id="brand" className="mt-1 rounded-none" {...form.register("brand")} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" className="mt-1 h-8 w-full border border-input bg-transparent px-2" {...form.register("status")}>
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
      </div>
      <div>
        <Label htmlFor="shortDescription">Short description</Label>
        <Textarea id="shortDescription" className="mt-1 rounded-none" rows={2} {...form.register("shortDescription")} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" className="mt-1 rounded-none" rows={5} {...form.register("description")} />
      </div>
      <div>
        <Label htmlFor="seoTitle">SEO title</Label>
        <Input id="seoTitle" className="mt-1 rounded-none" {...form.register("seoTitle")} />
      </div>
      <div>
        <Label htmlFor="seoDescription">SEO description</Label>
        <Textarea id="seoDescription" className="mt-1 rounded-none" rows={2} {...form.register("seoDescription")} />
      </div>
      {categories.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium">Categories</legend>
          <div className="mt-2 grid gap-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={category.id} {...form.register("categoryIds")} />
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <Button type="submit" disabled={!canMutate || form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : product ? "Save product" : "Create product"}
      </Button>
      {!canMutate ? <p className="text-xs text-muted-foreground">Staff have read-only access.</p> : null}
    </form>
  );
}
