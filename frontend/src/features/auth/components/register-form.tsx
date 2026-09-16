import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { registerRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { registerSchema, type RegisterValues } from "@/lib/auth/schemas";

export function RegisterForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <AuthPanel kicker="Account" title="Register">
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          try {
            const result = await registerRequest(values);
            if (result.needsVerification) {
              navigate(`${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(values.email)}`);
              return;
            }
            await refresh();
            navigate(result.redirectTo ?? "/account", { replace: true });
          } catch (error) {
            if (error instanceof ApiClientError) {
              setNotice(error.message);
              if (error.details) {
                for (const [key, message] of Object.entries(error.details)) {
                  form.setError(key as keyof RegisterValues, { message });
                }
              }
            } else {
              setNotice("Could not create account.");
            }
          }
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="fullName" className="label-caps text-[0.6rem]">Full name</Label>
          <Input id="fullName" autoComplete="name" className="h-12 rounded-none bg-transparent" {...form.register("fullName")} />
          <FieldError message={form.formState.errors.fullName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="label-caps text-[0.6rem]">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-12 rounded-none bg-transparent" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" className="h-12 rounded-none bg-transparent" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="label-caps text-[0.6rem]">Confirm password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" className="h-12 rounded-none bg-transparent" {...form.register("confirmPassword")} />
          <FieldError message={form.formState.errors.confirmPassword?.message} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          {form.formState.isSubmitting ? "Creating account" : "Create account"}
        </Button>
      </form>
      <FormNotice message={notice} tone="error" />
      <Link to="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">Already have an account</Link>
    </AuthPanel>
  );
}
