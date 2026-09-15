import { Suspense } from "react";

import { LoginForm } from "@/features/auth";
import { redirectIfAuthenticated } from "@/lib/auth/require-role";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
