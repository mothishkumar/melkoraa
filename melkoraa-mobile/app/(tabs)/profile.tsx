import { Link, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthGate } from "@/src/components/auth/AuthGate";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/auth/auth-context";
import { colors, spacing } from "@/src/theme";

function ProfileContent() {
  const { session, profile, signOut } = useAuth();

  return (
    <SafeScreen edges={["top"]}>
      <AppHeader title="Profile" showSearch={false} />
      <View style={styles.container}>
        <AppText variant="h2">{profile?.firstName ?? "Welcome"}</AppText>
        <AppText muted>{profile?.email ?? session?.user.email}</AppText>
        {profile ? (
          <AppText variant="caption" muted>Role: {profile.role}</AppText>
        ) : (
          <AppText variant="caption" muted>
            Profile API may be unavailable until Bearer auth is enabled on the backend.
          </AppText>
        )}

        <Link href="/orders" asChild>
          <Pressable style={styles.linkRow}><AppText variant="h3">Orders</AppText></Pressable>
        </Link>
        <Link href="/account/addresses" asChild>
          <Pressable style={styles.linkRow}><AppText variant="h3">Addresses</AppText></Pressable>
        </Link>
        <Link href="/wishlist" asChild>
          <Pressable style={styles.linkRow}><AppText variant="h3">Wishlist</AppText></Pressable>
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

export default function ProfileScreen() {
  return (
    <AuthGate
      title="Your profile"
      message="Sign in to access your MELKORAA account, orders, and saved pieces."
      headerTitle="Profile">
      <ProfileContent />
    </AuthGate>
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
    borderBottomColor: colors.border,
  },
});
