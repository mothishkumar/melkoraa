import { useSearchParams } from "react-router-dom";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export function LoginPage() {
  return <LoginForm />;
}

export function RegisterPage() {
  return <RegisterForm />;
}

export function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

export function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  return <VerifyEmailForm initialEmail={params.get("email") ?? undefined} />;
}
