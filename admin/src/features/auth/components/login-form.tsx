import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { getMeRequest, loginRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { hasStaffAccess } from "@/lib/auth/permissions";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";
import type { UserRole } from "@/lib/auth/types";

export function AdminLoginForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });

  return (
    <div className="admin-shell mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Staff sign in</h1>
      <p className="mt-2 text-sm text-zinc-500">MELKORAA operations console</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          try {
            await loginRequest({ email: values.email, password: values.password });
            await refresh();
            const me = await getMeRequest();
            if (!hasStaffAccess(me.role as UserRole)) {
              setNotice("This account does not have staff access.");
              return;
            }
            navigate(next.startsWith("/") ? next : "/", { replace: true });
          } catch (error) {
            setNotice(
              error instanceof ApiClientError ? error.message : "Sign in failed. Try again.",
            );
          }
        })}
      >
        {notice ? (
          <p className="text-sm text-destructive" role="status">
            {notice}
          </p>
        ) : null}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1" {...form.register("email")} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1" {...form.register("password")} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
