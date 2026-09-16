import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { colors } from "@/src/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "house", android: "home", web: "home" }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarAccessibilityLabel: "Shop tab",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "bag", android: "shopping_bag", web: "shopping_bag" }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarAccessibilityLabel: "Cart tab",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "cart", android: "shopping_cart", web: "shopping_cart" }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile tab",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "person", android: "person", web: "person" }} tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
