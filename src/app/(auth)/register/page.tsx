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

export default function RegisterPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="w-full max-w-md">
      <p className="label-caps">Account</p>
      <h1 className="editorial-display mt-4 text-4xl">Register</h1>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(() => {
          setNotice("Registration is not connected. Email verification will ship with authentication.");
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="label-caps text-[0.6rem]">
            Email
          </Label>
          <Input id="email" type="email" className="h-12 rounded-none bg-transparent" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="label-caps text-[0.6rem]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            className="h-12 rounded-none bg-transparent"
            {...form.register("password")}
          />
        </div>
        <Button type="submit" className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          Create account
        </Button>
      </form>
      {notice ? <p className="mt-6 text-sm text-stone">{notice}</p> : null}
      <Link href="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">
        Already have an account
      </Link>
    </div>
  );
}
