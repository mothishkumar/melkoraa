import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import type { PublicImage } from "@/src/api/types/catalog";
import { colors, spacing } from "@/src/theme";

const { width } = Dimensions.get("window");

type ImageGalleryProps = {
  images: PublicImage[];
};

export function ImageGallery({ images }: ImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(next);
        }}>
        {sorted.map((image) => (
          <Image
            key={image.id}
            source={{ uri: image.url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ))}
      </ScrollView>
      {sorted.length > 1 ? (
        <View style={styles.dots}>
          {sorted.map((image, dotIndex) => (
            <View key={image.id} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width,
    height: width * 1.2,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    width,
    height: width * 1.2,
    backgroundColor: colors.skeleton,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.text,
  },
});
