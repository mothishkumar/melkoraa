import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import type { PublicCollection } from "@/src/api/types/catalog";
import { brand } from "@/src/brand";
import { AppText } from "@/src/components/ui/AppText";
import { colors, radii, spacing } from "@/src/theme";

type HeroBannerProps = {
  collection?: PublicCollection | null;
  onPress?: () => void;
};

export function HeroBanner({ collection, onPress }: HeroBannerProps) {
  const title = collection?.name ?? brand.drop.name;
  const subtitle = collection?.description ?? brand.tagline;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${brand.drop.label}. ${title}`}>
      {collection?.heroImageUrl ? (
        <Image
          source={{ uri: collection.heroImageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={title}
        />
      ) : (
        <View style={styles.fallback} />
      )}
      <View style={styles.overlay} />
      <View style={styles.copy}>
        <AppText variant="label" color={colors.accentInverse}>{brand.drop.code}</AppText>
        <AppText variant="h1" color={colors.accentInverse} style={styles.title}>{title}</AppText>
        <AppText variant="body" color={colors.accentInverse} style={styles.subtitle}>{subtitle}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.accent,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  copy: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    maxWidth: "90%",
  },
  subtitle: {
    opacity: 0.9,
    maxWidth: "85%",
  },
});
