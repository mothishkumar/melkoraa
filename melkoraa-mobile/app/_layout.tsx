import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, router } from "expo-router";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { completeAuthCallbackFromUrl } from "@/src/auth/auth-callback";
import { AuthProvider, useAuth } from "@/src/auth/auth-context";
import { OfflineBanner } from "@/src/components/ui/OfflineBanner";
import { WishlistProvider } from "@/src/providers/wishlist-provider";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <WishlistProvider>
        <RootLayoutWithSplash />
      </WishlistProvider>
    </AuthProvider>
  );
}

function RootLayoutWithSplash() {
  const { restoring, configured } = useAuth();

  useEffect(() => {
    if (!configured || !restoring) {
      SplashScreen.hideAsync();
    }
  }, [configured, restoring]);

  if (configured && restoring) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      if (!url.includes("auth/callback")) return;
      try {
        const result = await completeAuthCallbackFromUrl(url);
        router.replace(result.nextPath);
      } catch {
        router.replace("/auth/callback");
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <OfflineBanner />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false }} />
        <Stack.Screen name="account/addresses" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
        <Stack.Screen name="orders/index" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/success" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
