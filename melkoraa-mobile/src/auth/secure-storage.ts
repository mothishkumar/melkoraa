import { Platform } from "react-native";

import { createWebStorage } from "@/src/auth/web-storage";
import type { StorageAdapter } from "@/src/auth/storage-core";

let storage: StorageAdapter | null = null;

export function resetSecureStorageCache(): void {
  storage = null;
}

function getSecureStorage(): StorageAdapter {
  if (storage) return storage;

  if (Platform.OS === "web") {
    storage = createWebStorage();
    return storage;
  }

  const { createNativeSecureStorage } =
    require("@/src/auth/native-secure-storage") as typeof import("@/src/auth/native-secure-storage");
  storage = createNativeSecureStorage();
  return storage;
}

export const secureStorage: StorageAdapter = {
  getItem(key: string) {
    return getSecureStorage().getItem(key);
  },
  setItem(key: string, value: string) {
    return getSecureStorage().setItem(key, value);
  },
  removeItem(key: string) {
    return getSecureStorage().removeItem(key);
  },
};
