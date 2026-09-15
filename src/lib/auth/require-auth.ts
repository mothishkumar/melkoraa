import "server-only";

import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/lib/auth/routes";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import type { AuthenticatedContext } from "@/lib/auth/types";

export async function requireAuth(nextPath = "/account"): Promise<AuthenticatedContext> {
  const user = await getCurrentUser();
  if (!user) {
    const next = getSafeRedirectPath(nextPath, "/account");
    redirect(`${AUTH_ROUTES.login}?next=${encodeURIComponent(next)}`);
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/unauthorized");
  }

  return { user, profile };
}
