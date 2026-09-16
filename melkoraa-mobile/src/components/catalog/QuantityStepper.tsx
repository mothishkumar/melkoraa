import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";

const MAX_QTY = 20;

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, onChange }: QuantityStepperProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label">Quantity</AppText>
      <View style={styles.stepper}>
        <Pressable
          style={styles.button}
          onPress={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          accessibilityLabel="Decrease quantity">
          <AppText variant="h3">−</AppText>
        </Pressable>
        <AppText variant="h3" style={styles.value}>{value}</AppText>
        <Pressable
          style={styles.button}
          onPress={() => onChange(Math.min(MAX_QTY, value + 1))}
          disabled={value >= MAX_QTY}
          accessibilityLabel="Increase quantity">
          <AppText variant="h3">+</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 36,
    textAlign: "center",
  },
});
