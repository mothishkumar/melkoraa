import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import type { ProductListItem } from "@/src/api/types/catalog";
import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";
import { getProductImageUrl } from "@/src/utils/product";

type HorizontalProductRowProps = {
  title: string;
  products: ProductListItem[];
  onSeeAll?: () => void;
};

export function HorizontalProductRow({ title, products, onSeeAll }: HorizontalProductRowProps) {
  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h2">{title}</AppText>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <AppText variant="caption" muted>See all</AppText>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {products.map((product) => {
          const imageUrl = getProductImageUrl(product);
          return (
            <Pressable
              key={product.id}
              style={styles.card}
              onPress={() => router.push(`/product/${product.slug}`)}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={styles.placeholder} />
              )}
              <AppText variant="caption" numberOfLines={2} style={styles.name}>{product.name}</AppText>
              <AppText variant="h3">{formatPrice(product.basePrice)}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 140,
  },
  image: {
    width: 140,
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    width: 140,
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.skeleton,
  },
  name: {
    marginTop: spacing.sm,
    minHeight: 32,
  },
});
