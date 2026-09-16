import { ScrollView, StyleSheet, View } from "react-native";

import type { PublicCategory } from "@/src/api/types/catalog";
import { Chip } from "@/src/components/ui/Chip";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme";

type CategoryRowProps = {
  categories: PublicCategory[];
  selectedSlug?: string;
  onSelect: (slug?: string) => void;
};

export function CategoryRow({ categories, selectedSlug, onSelect }: CategoryRowProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" style={styles.heading}>Categories</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="All" selected={!selectedSlug} onPress={() => onSelect(undefined)} />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            selected={selectedSlug === category.slug}
            onPress={() => onSelect(category.slug)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  heading: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
