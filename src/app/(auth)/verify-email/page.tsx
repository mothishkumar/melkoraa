import { VerifyEmailForm } from "@/features/auth";

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

  return <VerifyEmailForm initialEmail={email} />;
}
