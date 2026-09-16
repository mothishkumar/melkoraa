import { VerifyEmailForm } from "@/features/auth";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const metadata = {
  title: "Verify email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim().slice(0, 254);
  const user = await getCurrentUser();
  const alreadyVerified = Boolean(user?.email_confirmed_at);

  return (
    <VerifyEmailForm
      initialEmail={email ?? user?.email ?? undefined}
      alreadyVerified={alreadyVerified}
    />
  );
}
