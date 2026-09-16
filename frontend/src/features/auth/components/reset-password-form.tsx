import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMeRequest, resetPasswordRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/schemas";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    void getMeRequest()
      .then(() => setReady(true))
      .catch(() => setReady(false))
      .finally(() => setChecked(true));
  }, []);

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
        <Link to="/forgot-password" className="mt-8 inline-block text-sm text-stone hover:text-off-white">Request a new link</Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel kicker="Account" title="Reset password">
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          try {
            const result = await resetPasswordRequest(values);
            navigate(result.redirectTo ?? "/login?reset=1", { replace: true });
          } catch (error) {
            if (error instanceof ApiClientError) {
              setNotice(error.message);
              if (error.details) {
                for (const [key, message] of Object.entries(error.details)) {
                  form.setError(key as keyof ResetPasswordValues, { message });
                }
              }
            } else {
              setNotice(AUTH_MESSAGES.unexpected);
            }
          }
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" className="h-12 rounded-none bg-transparent" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="label-caps text-[0.6rem]">Confirm password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" className="h-12 rounded-none bg-transparent" {...form.register("confirmPassword")} />
          <FieldError message={form.formState.errors.confirmPassword?.message} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          {form.formState.isSubmitting ? "Updating" : "Update password"}
        </Button>
      </form>
      <FormNotice message={notice} tone="error" />
      <Link to="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">Back to login</Link>
    </AuthPanel>
  );
}
