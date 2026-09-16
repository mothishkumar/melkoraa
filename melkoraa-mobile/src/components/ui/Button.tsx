import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";

type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}>
      <AppText
        variant="label"
        color={variant === "primary" ? colors.accentInverse : colors.text}
        style={styles.label}>
        {loading ? "Please wait…" : label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    textTransform: "uppercase",
  },
});
