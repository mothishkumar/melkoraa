import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/auth/auth-context";
import { colors, radii, spacing } from "@/src/theme";
import { userFacingApiMessage } from "@/src/api/errors";

export default function ResetPasswordScreen() {
  const { session, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updatePassword(password);
      router.replace("/(tabs)/profile");
    } catch (err) {
      setError(userFacingApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <SafeScreen>
        <AppText variant="h2">Reset password</AppText>
        <AppText muted style={styles.copy}>
          Open the reset link from your email on this device to continue, or request a new link from forgot password.
        </AppText>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <AppText variant="h2">Choose a new password</AppText>
      <TextInput
        secureTextEntry
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        secureTextEntry
        placeholder="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
      />
      {error ? <AppText color={colors.error}>{error}</AppText> : null}
      <Button label="Update password" onPress={onSubmit} loading={submitting} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginTop: spacing.md,
  },
  input: {
    marginTop: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
