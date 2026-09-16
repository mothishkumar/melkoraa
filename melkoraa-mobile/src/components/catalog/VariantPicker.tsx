import { Pressable, StyleSheet, View } from "react-native";

import type { PublicVariant } from "@/src/api/types/catalog";
import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";

type VariantPickerProps = {
  colorOptions: string[];
  sizes: PublicVariant[];
  selectedColor: string;
  selectedSize: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
};

export function VariantPicker({
  colorOptions,
  sizes,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: VariantPickerProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" style={styles.label}>Color</AppText>
      <View style={styles.row}>
        {colorOptions.map((color) => (
          <Pressable
            key={color}
            onPress={() => onColorChange(color)}
            style={[styles.chip, selectedColor === color && styles.chipSelected]}>
            <AppText variant="caption" color={selectedColor === color ? colors.accentInverse : colors.text}>
              {color}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="label" style={styles.label}>Size</AppText>
      <View style={styles.row}>
        {sizes.map((variant) => {
          const disabled = !variant.available;
          const selected = selectedSize === variant.size;
          return (
            <Pressable
              key={variant.id}
              disabled={disabled}
              onPress={() => onSizeChange(variant.size)}
              style={[
                styles.sizeChip,
                selected && styles.chipSelected,
                disabled && styles.disabled,
              ]}>
              <AppText
                variant="caption"
                color={selected ? colors.accentInverse : disabled ? colors.textMuted : colors.text}>
                {variant.size}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sizeChip: {
    minWidth: 52,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.4,
  },
});
