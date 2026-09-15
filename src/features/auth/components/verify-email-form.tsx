"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerificationAction } from "@/features/auth/actions";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { resendVerificationSchema } from "@/lib/auth/schemas";

export function VerifyEmailForm({ initialEmail }: { initialEmail?: string }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "error">("ok");
  const form = useForm<{ email: string }>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: initialEmail ?? "" },
  });

  return (
    <AuthPanel kicker="Account" title="Verify email">
      <p className="mt-6 text-sm leading-7 text-stone">
        Check your inbox for a confirmation link from MELKORAA. The link expires, and
        you can request another below.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          const result = await resendVerificationAction(values);
          if (!result.ok) {
            setTone("error");
            setNotice(result.message);
            return;
          }
          setTone("ok");
          setNotice(AUTH_MESSAGES.verifySent);
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
          {form.formState.isSubmitting ? "Sending" : "Resend confirmation"}
        </Button>
      </form>
      <FormNotice message={notice} tone={tone} />
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Back to login
      </Link>
    </AuthPanel>
  );
}
