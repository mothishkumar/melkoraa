import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { completeAuthCallbackFromUrl } from "@/src/auth/auth-callback";
import { AppText } from "@/src/components/ui/AppText";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { Button } from "@/src/components/ui/Button";
import { colors, spacing } from "@/src/theme";
import { userFacingApiMessage } from "@/src/api/errors";

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (!initialUrl) {
          throw new Error("No authentication link was provided.");
        }
        const result = await completeAuthCallbackFromUrl(initialUrl);
        if (!active) return;
        router.replace(result.nextPath);
      } catch (err) {
        if (!active) return;
        setError(userFacingApiMessage(err, "Could not complete authentication."));
      }
    }

    handleCallback();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeScreen>
      <View style={styles.container}>
        {error ? (
          <>
            <AppText variant="h2">Link could not be opened</AppText>
            <AppText muted style={styles.copy}>{error}</AppText>
            <Button label="Back to sign in" onPress={() => router.replace("/(auth)/login")} />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.text} />
            <AppText muted style={styles.copy}>Completing sign-in…</AppText>
          </>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  copy: {
    textAlign: "center",
  },
});
