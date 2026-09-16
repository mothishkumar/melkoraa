import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme";

type EmptyStateProps = {
  title: string;
  message?: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h2">{title}</AppText>
      {message ? <AppText muted style={styles.message}>{message}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  message: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
