import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/auth/auth-context";
import { colors, radii, spacing, typography } from "@/src/theme";
import { userFacingApiMessage } from "@/src/api/errors";

export default function LoginScreen() {
  const { configured, signIn } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const pending = await signIn({ email: email.trim(), password });
      const destination =
        pending?.returnPath ?? (typeof returnTo === "string" ? returnTo : "/(tabs)/profile");
      router.replace(destination as never);
    } catch (err) {
      setError(userFacingApiMessage(err, "Sign in failed."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <SafeScreen>
        <AppText>Copy `.env.example` to `.env` and set Supabase keys.</AppText>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <AppText variant="brand" style={styles.brand}>MELKORAA</AppText>
          <AppText variant="h1">Welcome back</AppText>
          <AppText muted>Sign in to shop, save pieces, and checkout.</AppText>

          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Password"
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          {error ? <AppText color={colors.error}>{error}</AppText> : null}
          <Button label="Sign in" onPress={onSubmit} loading={submitting} />
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable><AppText style={styles.link}>Forgot password?</AppText></Pressable>
          </Link>
          <Link href="/(auth)/register" asChild>
            <Pressable><AppText style={styles.link}>Create account</AppText></Pressable>
          </Link>
          {submitting ? <ActivityIndicator color={colors.text} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  brand: {
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  link: {
    color: colors.text,
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
