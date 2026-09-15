import type { ReactNode } from "react";

import { requireAuth } from "@/lib/auth/require-auth";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireAuth("/account");
  return children;
}
