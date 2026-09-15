"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="w-full max-w-md">
      <p className="label-caps">Account</p>
      <h1 className="editorial-display mt-4 text-4xl">Login</h1>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(() => {
          setNotice("Authentication is foundation-only. Sign-in will be enabled in the auth phase.");
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
          {form.formState.errors.email ? (
            <p className="text-sm text-stone">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-12 rounded-none bg-transparent"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-stone">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          Continue
        </Button>
      </form>
      {notice ? <p className="mt-6 text-sm text-stone">{notice}</p> : null}
      <div className="mt-8 flex flex-col gap-3 text-sm text-stone">
        <Link href="/register" className="hover:text-off-white">
          Create an account
        </Link>
        <Link href="/forgot-password" className="hover:text-off-white">
          Forgot password
        </Link>
      </div>
    </div>
  );
}
