import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { spacing } from "@/src/theme";

type LoginRequiredProps = {
  title: string;
  message: string;
  apiNote?: string;
};

export function LoginRequired({ title, message, apiNote }: LoginRequiredProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h2">{title}</AppText>
      <AppText muted style={styles.message}>{message}</AppText>
      {apiNote ? <AppText variant="caption" muted style={styles.note}>{apiNote}</AppText> : null}
      <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      <Button
        label="Create account"
        variant="secondary"
        onPress={() => router.push("/(auth)/register")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  message: {
    textAlign: "center",
  },
  note: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
