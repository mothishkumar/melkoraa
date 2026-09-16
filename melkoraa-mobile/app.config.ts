import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV === "production" ? "production" : "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MELKORAA",
  slug: "melkoraa",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "melkoraa",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "in.melkoraa.app",
    infoPlist: {
      CFBundleDisplayName: "MELKORAA",
    },
  },
  android: {
    package: "in.melkoraa.app",
    adaptiveIcon: {
      backgroundColor: "#050505",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#050505",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "melkoraa-mobile-phase1",
    },
    router: {},
  },
});
