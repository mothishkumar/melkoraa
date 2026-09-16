import { Text, type TextProps, StyleSheet } from "react-native";

import { colors, typography } from "@/src/theme";

type Variant = "brand" | "h1" | "h2" | "h3" | "body" | "caption" | "label";

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  color?: string;
};

export function AppText({
  variant = "body",
  muted = false,
  color,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        typography[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text) },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
