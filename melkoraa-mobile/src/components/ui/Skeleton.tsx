import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radii } from "@/src/theme";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radii.sm,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={220} borderRadius={radii.md} />
      <Skeleton height={14} style={styles.line} />
      <Skeleton height={12} width="40%" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.skeleton,
  },
  card: {
    flex: 1,
    gap: 8,
  },
  line: {
    marginTop: 8,
  },
});
