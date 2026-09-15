"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/features/auth/actions";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { registerSchema, type RegisterValues } from "@/lib/auth/schemas";

export function RegisterForm() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <AuthPanel kicker="Account" title="Register">
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setNotice(null);
          const result = await registerAction(values);
          if (!result.ok) {
            setNotice(result.message);
            if (result.fieldErrors) {
              for (const [key, message] of Object.entries(result.fieldErrors)) {
                form.setError(key as keyof RegisterValues, { message });
              }
            }
            return;
          }
          if (result.needsVerification) {
            router.push(
              `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(values.email)}`,
            );
            return;
          }
          router.replace(result.redirectTo ?? "/account");
          router.refresh();
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="fullName" className="label-caps text-[0.6rem]">
            Full name
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            className="h-12 rounded-none bg-transparent"
            {...form.register("fullName")}
          />
          <FieldError message={form.formState.errors.fullName?.message} />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">
            Password
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
          {form.formState.isSubmitting ? "Creating account" : "Create account"}
        </Button>
      </form>
      <FormNotice message={notice} tone="error" />
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Already have an account
      </Link>
    </AuthPanel>
  );
}
