/** Mirrors `src/lib/brand.ts` on the web app. */
export const brand = {
  name: "MELKORAA",
  tagline: "BUILD YOUR OWN IDENTITY.",
  drop: {
    code: "DROP 001",
    name: "THE BUILDER",
    label: "DROP 001 — THE BUILDER",
    message: "BUILT FROM NOTHING.",
  },
  copy: {
    path: "FOR THOSE WHO BUILD THEIR OWN PATH.",
    exclusive: "NOT MADE FOR EVERYONE.",
    keepBuilding: "KEEP BUILDING.",
  },
} as const;

export const brandColors = {
  black: "#050505",
  offWhite: "#F5F3EE",
  charcoal: "#171717",
  stone: "#A6A29A",
  white: "#FFFFFF",
} as const;
