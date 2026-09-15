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
import { createAdminDropRequest, updateAdminDropRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import { createDropSchema } from "@/lib/validation/catalog";
import type { PublicDropSummary } from "@/types/catalog";

const formSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80),
  description: z.string().optional(),
  status: z.enum(["draft", "scheduled", "active", "ended", "archived"]),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  isLimited: z.boolean(),
  isNeverRestocked: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function DropForm({
  drop,
  onSaved,
}: {
  drop?: PublicDropSummary;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { canMutate } = useAdminAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: drop?.name ?? "",
      slug: drop?.slug ?? "",
      description: drop?.description ?? "",
      status: drop?.status ?? "draft",
      startAt: toLocalInput(drop?.startAt ?? null),
      endAt: toLocalInput(drop?.endAt ?? null),
      isLimited: drop?.isLimited ?? true,
      isNeverRestocked: drop?.isNeverRestocked ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    setNotice(null);
    const parsed = createDropSchema.safeParse({
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      status: values.status,
      startAt: toIso(values.startAt),
      endAt: toIso(values.endAt),
      isLimited: values.isLimited,
      isNeverRestocked: values.isNeverRestocked,
    });
    if (!parsed.success) {
      setNotice("Check the drop fields and try again.");
      return;
    }
    const payload = parsed.data;
    try {
      if (drop) {
        await updateAdminDropRequest(drop.id, payload);
        setNotice("Saved.");
        router.refresh();
        onSaved?.();
      } else {
        const created = await createAdminDropRequest(payload);
        router.push(`/admin/drops/${created.id}`);
      }
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <AdminNotice message={notice} tone={notice === "Saved." ? "info" : "error"} />
      <div>
        <Label htmlFor="drop-name">Name</Label>
        <Input id="drop-name" className="mt-1 rounded-none" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="drop-slug">Slug</Label>
        <Input id="drop-slug" className="mt-1 rounded-none font-mono" {...form.register("slug")} />
      </div>
      <div>
        <Label htmlFor="drop-status">Status</Label>
        <select id="drop-status" className="mt-1 h-8 w-full border border-input bg-transparent px-2" {...form.register("status")}>
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          <option value="active">active</option>
          <option value="ended">ended</option>
          <option value="archived">archived</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="drop-start">Start</Label>
          <Input id="drop-start" type="datetime-local" className="mt-1 rounded-none" {...form.register("startAt")} />
        </div>
        <div>
          <Label htmlFor="drop-end">End</Label>
          <Input id="drop-end" type="datetime-local" className="mt-1 rounded-none" {...form.register("endAt")} />
        </div>
      </div>
      <div>
        <Label htmlFor="drop-description">Description</Label>
        <Textarea id="drop-description" className="mt-1 rounded-none" rows={3} {...form.register("description")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isLimited")} />
        Limited
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isNeverRestocked")} />
        Never restocked
      </label>
      <Button type="submit" disabled={!canMutate || form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : drop ? "Save drop" : "Create drop"}
      </Button>
    </form>
  );
}
