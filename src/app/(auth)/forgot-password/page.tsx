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
});

export default function ForgotPasswordPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <div className="w-full max-w-md">
      <p className="label-caps">Account</p>
      <h1 className="editorial-display mt-4 text-4xl">Forgot password</h1>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(() => {
          setNotice("Password reset email is not sent in this phase.");
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="label-caps text-[0.6rem]">
            Email
          </Label>
          <Input id="email" type="email" className="h-12 rounded-none bg-transparent" {...form.register("email")} />
        </div>
        <Button type="submit" className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          Send reset
        </Button>
      </form>
      {notice ? <p className="mt-6 text-sm text-stone">{notice}</p> : null}
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Back to login
      </Link>
    </div>
  );
}
