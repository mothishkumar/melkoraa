"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/features/auth/actions";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <AuthPanel kicker="Account" title="Forgot password">
      {sent ? (
        <FormNotice message={AUTH_MESSAGES.resetSent} tone="ok" />
      ) : (
        <form
          className="mt-10 space-y-6"
          onSubmit={form.handleSubmit(async (values) => {
            setNotice(null);
            const result = await forgotPasswordAction(values);
            if (!result.ok) {
              setNotice(result.message);
              return;
            }
            setSent(true);
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="label-caps text-[0.6rem]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-12 rounded-none bg-transparent"
              {...form.register("email")}
            />
            <FieldError message={form.formState.errors.email?.message} />
          </div>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-12 w-full rounded-none tracking-[0.2em] uppercase"
          >
            {form.formState.isSubmitting ? "Sending" : "Send reset"}
          </Button>
        </form>
      )}
      <FormNotice message={notice} tone="error" />
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Back to login
      </Link>
    </AuthPanel>
  );
}
