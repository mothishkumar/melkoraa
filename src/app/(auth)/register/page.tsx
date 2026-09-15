import { RegisterForm } from "@/features/auth";
import { redirectIfAuthenticated } from "@/lib/auth/require-role";

export const metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  await redirectIfAuthenticated();
  return <RegisterForm />;
}
