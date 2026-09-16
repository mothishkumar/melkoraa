import { brandColors } from "@/src/brand";

export const colors = {
  background: brandColors.offWhite,
  surface: brandColors.white,
  surfaceMuted: "#F2F0EC",
  text: brandColors.black,
  textSecondary: "#5C5C5C",
  textMuted: brandColors.stone,
  border: "#E8E4DE",
  borderStrong: brandColors.black,
  accent: brandColors.black,
  accentInverse: brandColors.white,
  sale: "#8B2635",
  error: "#B42318",
  success: "#1F6B45",
  overlay: "rgba(5, 5, 5, 0.45)",
  skeleton: "#ECE8E2",
  skeletonHighlight: "#F7F4EF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
};

export const typography = {
  brand: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 4,
  },
  h1: {
    fontSize: 28,
    fontWeight: "600" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
};

export const layout = {
  screenPadding: spacing.lg,
  tabBarHeight: 56,
  headerHeight: 56,
  productCardGap: spacing.md,
  maxContentWidth: 720,
};
