import { Link, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { LoginRequired } from "@/src/components/ui/LoginRequired";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/auth/auth-context";
import { spacing } from "@/src/theme";

export default function ProfileScreen() {
  const { configured, loading, session, profile, signOut } = useAuth();

  if (!configured) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title="Profile" showSearch={false} />
        <View style={styles.container}>
          <AppText>Configure Supabase keys in `.env` to enable sign-in.</AppText>
        </View>
      </SafeScreen>
    );
  }

  if (loading) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title="Profile" showSearch={false} />
        <View style={styles.container}>
          <AppText muted>Loading…</AppText>
        </View>
      </SafeScreen>
    );
  }

  if (!session) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title="Profile" showSearch={false} />
        <LoginRequired
          title="Your profile"
          message="Sign in to access your MELKORAA account, orders, and saved pieces."
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={["top"]}>
      <AppHeader title="Profile" showSearch={false} />
      <View style={styles.container}>
        <AppText variant="h2">{profile?.firstName ?? "Welcome"}</AppText>
        <AppText muted>{profile?.email ?? session.user.email}</AppText>
        {profile ? (
          <AppText variant="caption" muted>Role: {profile.role}</AppText>
        ) : (
          <AppText variant="caption" muted>
            Profile API unavailable until Bearer auth is supported.
          </AppText>
        )}
        <Link href="/wishlist" asChild>
          <Pressable style={styles.linkRow}>
            <AppText variant="h3">Wishlist</AppText>
          </Pressable>
        </Link>
        <Button
          label="Sign out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  linkRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E4DE",
  },
});
