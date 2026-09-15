"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <div className="w-full max-w-md">
      <p className="label-caps">Account</p>
      <h1 className="editorial-display mt-4 text-4xl">Reset password</h1>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(() => {
          setNotice("Password update is not connected to Supabase Auth yet.");
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">
            New password
          </Label>
          <Input
            id="password"
            type="password"
            className="h-12 rounded-none bg-transparent"
            {...form.register("password")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="label-caps text-[0.6rem]">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            className="h-12 rounded-none bg-transparent"
            {...form.register("confirmPassword")}
          />
        </div>
        <Button type="submit" className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          Update password
        </Button>
      </form>
      {notice ? <p className="mt-6 text-sm text-stone">{notice}</p> : null}
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Back to login
      </Link>
    </div>
  );
}
