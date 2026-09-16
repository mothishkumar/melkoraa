import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ImageGallery } from "@/src/components/catalog/ImageGallery";
import { VariantPicker } from "@/src/components/catalog/VariantPicker";
import { QuantityStepper } from "@/src/components/catalog/QuantityStepper";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { ProductCardSkeleton } from "@/src/components/ui/Skeleton";
import { useProduct } from "@/src/hooks/use-product";
import { useCart } from "@/src/hooks/use-cart";
import { useWishlistContext } from "@/src/providers/wishlist-provider";
import { useAuth } from "@/src/auth/auth-context";
import { spacing } from "@/src/theme";
import { formatPrice, isOnSale } from "@/src/utils/format";
import { findVariant, getSizesForColor, getUniqueColors } from "@/src/utils/product";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { product, loading, error, reload } = useProduct(slug);
  const { addItem, mutating, authRequired } = useCart();
  const { toggle, isSaved } = useWishlistContext();
  const { session } = useAuth();

  const colorsList = useMemo(
    () => (product ? getUniqueColors(product.variants) : []),
    [product],
  );
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const activeColor = selectedColor || colorsList[0] || "";
  const sizesForColor = useMemo(
    () => (product ? getSizesForColor(product.variants, activeColor) : []),
    [product, activeColor],
  );
  const activeSize = selectedSize || sizesForColor[0]?.size || "";
  const selectedVariant = product
    ? findVariant(product.variants, activeColor, activeSize)
    : undefined;

  async function handleAddToCart() {
    if (!session) {
      router.push("/(auth)/login");
      return;
    }
    if (!selectedVariant) {
      Alert.alert("Select a variant", "Choose color and size before adding to bag.");
      return;
    }
    const result = await addItem(selectedVariant.id, quantity);
    if (result?.status === "auth_required") {
      Alert.alert(
        "Sign in required",
        "Cart API returned 401. Bearer token support is needed on the backend.",
      );
      router.push("/(auth)/login");
      return;
    }
    if (result?.status === "success") {
      Alert.alert("Added to bag", `${product?.name} was added to your cart.`);
    } else if (result?.status === "error") {
      Alert.alert("Unable to add", result.message);
    }
  }

  async function handleWishlist() {
    if (!product) return;
    if (!session) {
      router.push("/(auth)/login");
      return;
    }
    await toggle(product.id);
  }

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader back showSearch={false} />
      {loading ? (
        <View style={styles.loading}>
          <ProductCardSkeleton />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : product ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ImageGallery images={product.images} />
          <View style={styles.body}>
            {product.isNew ? <AppText variant="label">New arrival</AppText> : null}
            <AppText variant="h1">{product.name}</AppText>
            <AppText muted>{product.brand}</AppText>
            <View style={styles.priceRow}>
              <AppText variant="h2">
                {formatPrice(selectedVariant?.price ?? product.basePrice)}
              </AppText>
              {isOnSale(product.basePrice, product.compareAtPrice) && product.compareAtPrice ? (
                <AppText variant="caption" muted style={styles.compare}>
                  {formatPrice(product.compareAtPrice)}
                </AppText>
              ) : null}
            </View>
            {product.shortDescription ? (
              <AppText style={styles.description}>{product.shortDescription}</AppText>
            ) : null}
            {product.description ? (
              <AppText muted style={styles.description}>{product.description}</AppText>
            ) : null}

            {colorsList.length > 0 ? (
              <VariantPicker
                colorOptions={colorsList}
                sizes={sizesForColor}
                selectedColor={activeColor}
                selectedSize={activeSize}
                onColorChange={(color) => {
                  setSelectedColor(color);
                  setSelectedSize("");
                }}
                onSizeChange={setSelectedSize}
              />
            ) : null}

            <QuantityStepper value={quantity} onChange={setQuantity} />

            <View style={styles.actions}>
              <Button
                label={authRequired ? "Sign in to add" : "Add to bag"}
                onPress={handleAddToCart}
                loading={mutating}
              />
              <Button
                label={isSaved(product.id) ? "Saved" : "Wishlist"}
                variant="secondary"
                onPress={handleWishlist}
              />
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: spacing.lg,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  compare: {
    textDecorationLine: "line-through",
  },
  description: {
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
