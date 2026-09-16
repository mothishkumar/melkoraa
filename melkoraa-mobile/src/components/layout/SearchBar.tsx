import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { colors, radii, spacing } from "@/src/theme";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Search the collection",
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <SymbolView
        name={{ ios: "magnifyingglass", android: "search", web: "search" }}
        size={18}
        tintColor={colors.textMuted}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={styles.input}
        accessibilityLabel="Search products"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <SymbolView name={{ ios: "xmark.circle.fill", android: "close", web: "close" }} size={18} tintColor={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
