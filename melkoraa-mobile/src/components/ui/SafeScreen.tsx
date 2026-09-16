import { type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout } from "@/src/theme";

type SafeScreenProps = {
  children: ReactNode;
  edges?: ("top" | "bottom")[];
  style?: ViewStyle;
  padded?: boolean;
};

export function SafeScreen({
  children,
  edges = ["top", "bottom"],
  style,
  padded = true,
}: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.base,
        {
          paddingTop: edges.includes("top") ? insets.top : 0,
          paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
          paddingHorizontal: padded ? layout.screenPadding : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
