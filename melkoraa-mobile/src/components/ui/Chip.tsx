import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <AppText variant="caption" color={selected ? colors.accentInverse : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
