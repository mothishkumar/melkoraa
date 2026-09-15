"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/features/auth/actions";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/schemas";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isPublicSupabaseConfigured } from "@/lib/env/public";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabaseConfigured = isPublicSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(!supabaseConfigured);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let settled = false;

    const markReady = () => {
      settled = true;
      setReady(true);
      setChecked(true);
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        markReady();
      }
    });

    const timeout = window.setTimeout(() => {
      if (!settled) setChecked(true);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [supabaseConfigured]);

  if (!checked) {
    return (
      <AuthPanel kicker="Account" title="Reset password">
        <p className="mt-10 text-sm text-stone">Checking reset session…</p>
      </AuthPanel>
    );
  }

  if (!ready) {
    return (
      <AuthPanel kicker="Account" title="Reset password">
        <FormNotice message={AUTH_MESSAGES.recoveryMissing} tone="error" />
        <Link href="/forgot-password" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
          Request a new link
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel kicker="Account" title="Reset password">
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          const result = await resetPasswordAction(values);
          if (!result.ok) {
            setNotice(result.message);
            if (result.fieldErrors) {
              for (const [key, message] of Object.entries(result.fieldErrors)) {
                form.setError(key as keyof ResetPasswordValues, { message });
              }
            }
            return;
          }
          router.replace(result.redirectTo ?? "/login?reset=1");
          router.refresh();
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">
            New password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="h-12 rounded-none bg-transparent"
            {...form.register("password")}
          />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="label-caps text-[0.6rem]">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="h-12 rounded-none bg-transparent"
            {...form.register("confirmPassword")}
          />
          <FieldError message={form.formState.errors.confirmPassword?.message} />
        </div>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-none tracking-[0.2em] uppercase"
        >
          {form.formState.isSubmitting ? "Updating" : "Update password"}
        </Button>
      </form>
      <FormNotice message={notice} tone="error" />
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Back to login
      </Link>
    </AuthPanel>
  );
}
