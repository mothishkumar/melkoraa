import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerificationRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { AuthPanel, FieldError, FormNotice } from "@/features/auth/components/auth-panel";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { resendVerificationSchema } from "@/lib/auth/schemas";

const RESEND_DEBOUNCE_MS = 60_000;

export function VerifyEmailForm({ initialEmail, alreadyVerified = false }: { initialEmail?: string; alreadyVerified?: boolean }) {
  const [notice, setNotice] = useState<string | null>(alreadyVerified ? AUTH_MESSAGES.alreadyVerified : null);
  const [tone, setTone] = useState<"ok" | "error">("ok");
  const [verified, setVerified] = useState(alreadyVerified);
  const [cooldownMs, setCooldownMs] = useState(0);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: initialEmail ?? "" },
  });

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const timer = window.setInterval(() => setCooldownMs((value) => Math.max(0, value - 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownMs]);

  if (verified) {
    return (
      <AuthPanel kicker="Account" title="Email confirmed">
        <p className="mt-6 text-sm leading-7 text-stone">{AUTH_MESSAGES.alreadyVerified}</p>
        <Link to={AUTH_ROUTES.login} className="mt-8 inline-block text-sm text-stone hover:text-off-white">Continue to login</Link>
      </AuthPanel>
    );
  }

  const coolingDown = cooldownMs > 0;
  const sending = form.formState.isSubmitting;

  return (
    <AuthPanel kicker="Account" title="Verify email">
      <p className="mt-6 text-sm leading-7 text-stone">
        Check your inbox for a confirmation link from MELKORAA. The link expires, and you can request another below.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          if (sending || coolingDown) {
            setTone("error");
            setNotice(AUTH_MESSAGES.cooldown);
            return;
          }
          setCooldownMs(RESEND_DEBOUNCE_MS);
          setNotice(null);
          try {
            await resendVerificationRequest(values);
            setTone("ok");
            setNotice(AUTH_MESSAGES.verifySent);
          } catch (error) {
            if (error instanceof ApiClientError && error.code === "ALREADY_VERIFIED") {
              setVerified(true);
              return;
            }
            setTone("error");
            setNotice(error instanceof ApiClientError ? error.message : AUTH_MESSAGES.verifySent);
            if (!(error instanceof ApiClientError) || error.message !== AUTH_MESSAGES.cooldown) {
              setCooldownMs(0);
            }
          }
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="label-caps text-[0.6rem]">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-12 rounded-none bg-transparent" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <Button type="submit" disabled={sending || coolingDown} className="h-12 w-full rounded-none tracking-[0.2em] uppercase">
          {sending ? "Sending" : coolingDown ? `Wait ${Math.ceil(cooldownMs / 1000)}s` : "Resend verification email"}
        </Button>
      </form>
      <FormNotice message={notice} tone={tone} />
      <Link to="/login" className="mt-8 inline-block text-sm text-stone hover:text-off-white">Back to login</Link>
    </AuthPanel>
  );
}
