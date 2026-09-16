import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useNetworkStatus } from "@/src/hooks/use-network-status";
import { colors, spacing } from "@/src/theme";

export function OfflineBanner() {
  const { offline } = useNetworkStatus();

  if (!offline) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.banner}>
      <AppText variant="caption" color={colors.accentInverse}>
        You are offline. Some actions will resume when connection returns.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
