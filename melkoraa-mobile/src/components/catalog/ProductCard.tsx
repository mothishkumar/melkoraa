import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";

import type { ProductListItem } from "@/src/api/types/catalog";
import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice, isOnSale } from "@/src/utils/format";
import { getProductImageUrl } from "@/src/utils/product";

type ProductCardProps = {
  product: ProductListItem;
  onWishlistPress?: () => void;
  wishlistActive?: boolean;
  showWishlist?: boolean;
};

export function ProductCard({
  product,
  onWishlistPress,
  wishlistActive = false,
  showWishlist = true,
}: ProductCardProps) {
  const imageUrl = getProductImageUrl(product);
  const onSale = isOnSale(product.basePrice, product.compareAtPrice);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/product/${product.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.badges}>
          {product.isNew ? <View style={styles.badge}><AppText variant="label" color={colors.accentInverse}>New</AppText></View> : null}
          {onSale ? <View style={[styles.badge, styles.saleBadge]}><AppText variant="label" color={colors.accentInverse}>Sale</AppText></View> : null}
        </View>
        {showWishlist ? (
          <Pressable
            style={styles.wishlist}
            onPress={(event) => {
              event.stopPropagation();
              onWishlistPress?.();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={wishlistActive ? "Remove from wishlist" : "Add to wishlist"}>
            <SymbolView
              name={{ ios: wishlistActive ? "heart.fill" : "heart", android: "favorite", web: "favorite" }}
              size={20}
              tintColor={wishlistActive ? colors.sale : colors.text}
            />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.meta}>
        <AppText variant="caption" numberOfLines={2} style={styles.name}>{product.name}</AppText>
        <View style={styles.priceRow}>
          <AppText variant="h3">{formatPrice(product.basePrice)}</AppText>
          {onSale && product.compareAtPrice ? (
            <AppText variant="caption" muted style={styles.compare}>
              {formatPrice(product.compareAtPrice)}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.skeleton,
  },
  badges: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  saleBadge: {
    backgroundColor: colors.sale,
  },
  wishlist: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    marginTop: spacing.sm,
    gap: 4,
  },
  name: {
    minHeight: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  compare: {
    textDecorationLine: "line-through",
  },
});
