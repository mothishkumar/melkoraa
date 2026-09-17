import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { loginRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";

export function LoginForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [searchParams] = useSearchParams();
  const resetOk = searchParams.get("reset") === "1";
  const authError = searchParams.get("error") === "auth";
  const next = getSafeRedirectPath(searchParams.get("next"), "");

  const [notice, setNotice] = useState<string | null>(
    resetOk ? AUTH_MESSAGES.passwordUpdated : authError ? AUTH_MESSAGES.unexpected : null,
  );
  const [tone, setTone] = useState<"muted" | "ok" | "error">(resetOk ? "ok" : "error");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });

  return (
    <AuthPanel kicker="Account" title="Login">
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          setUnverifiedEmail(null);
          try {
            const result = await loginRequest({
              email: values.email,
              password: values.password,
              next: next || undefined,
            });
            await refresh();
            navigate(result.redirectTo ?? (next || "/account"), { replace: true });
          } catch (error) {
            setTone("error");
            if (error instanceof ApiClientError) {
              setNotice(error.message);
              if (error.details?.needsVerification === "true") {
                setUnverifiedEmail(values.email);
              }
              if (error.details) {
                for (const [key, message] of Object.entries(error.details)) {
                  if (key !== "needsVerification") {
                    form.setError(key as keyof LoginValues, { message });
                  }
                }
              }
            } else {
              setNotice(AUTH_MESSAGES.invalidLogin);
            }
          }
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="label-caps text-[0.6rem]">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-12 rounded-none bg-transparent" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" className="h-12 rounded-none bg-transparent" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          {form.formState.isSubmitting ? "Signing in" : "Continue"}
        </Button>
      </form>
      <FormNotice message={notice} tone={tone} />
      {unverifiedEmail ? (
        <Link to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="mt-6 inline-block text-sm text-stone hover:text-off-white">
          Resend verification email
        </Link>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 text-sm text-stone">
        <Link to="/register" className="hover:text-off-white">Create an account</Link>
        <Link to="/forgot-password" className="hover:text-off-white">Forgot password</Link>
      </div>
    </AuthPanel>
  );
}
