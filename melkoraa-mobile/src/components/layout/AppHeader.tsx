import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { AppText } from "@/src/components/ui/AppText";
import { colors, layout, spacing } from "@/src/theme";

type AppHeaderProps = {
  showSearch?: boolean;
  showWishlist?: boolean;
  onWishlistPress?: () => void;
  title?: string;
  back?: boolean;
};

export function AppHeader({
  showSearch = true,
  showWishlist = false,
  onWishlistPress,
  title,
  back = false,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={colors.text} />
          </Pressable>
        ) : (
          <AppText variant="brand">MELKORAA</AppText>
        )}
      </View>
      {title ? <AppText variant="h3" style={styles.title}>{title}</AppText> : <View style={styles.spacer} />}
      <View style={styles.actions}>
        {showSearch ? (
          <Pressable
            onPress={() => router.push("/search")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Search">
            <SymbolView name={{ ios: "magnifyingglass", android: "search", web: "search" }} size={22} tintColor={colors.text} />
          </Pressable>
        ) : null}
        {showWishlist ? (
          <Pressable
            onPress={onWishlistPress}
            hitSlop={12}
            style={styles.wishlist}
            accessibilityRole="button"
            accessibilityLabel="Wishlist">
            <SymbolView name={{ ios: "heart", android: "favorite", web: "favorite" }} size={22} tintColor={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  left: {
    minWidth: 100,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  spacer: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  wishlist: {
    marginLeft: spacing.sm,
  },
});
