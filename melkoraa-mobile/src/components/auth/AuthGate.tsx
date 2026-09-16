import { router } from "expo-router";
import { type ReactNode } from "react";

import { LoginRequired } from "@/src/components/ui/LoginRequired";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { AppText } from "@/src/components/ui/AppText";
import { useAuth } from "@/src/auth/auth-context";

type AuthGateProps = {
  title: string;
  message: string;
  children: ReactNode;
  headerTitle?: string;
};

export function AuthGate({ title, message, children, headerTitle }: AuthGateProps) {
  const { configured, restoring, session } = useAuth();

  if (!configured) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title={headerTitle ?? title} showSearch={false} />
        <AppText style={{ padding: 16 }}>
          Configure Supabase keys in `.env` to enable sign-in.
        </AppText>
      </SafeScreen>
    );
  }

  if (restoring) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title={headerTitle ?? title} showSearch={false} />
        <AppText muted style={{ padding: 16 }}>Restoring your session…</AppText>
      </SafeScreen>
    );
  }

  if (!session) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title={headerTitle ?? title} showSearch={false} />
        <LoginRequired
          title={title}
          message={message}
          apiNote="Protected APIs need Bearer support on the API host. Production www.melkoraa.in may return 401 until main deploys commit 7467fb4 — use a local melkoraa_mobile API for full device testing."
        />
      </SafeScreen>
    );
  }

  return <>{children}</>;
}

export function requireAuthRedirect() {
  router.push("/(auth)/login");
}
