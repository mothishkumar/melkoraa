import * as SecureStore from "expo-secure-store";

import { createChunkedStorage, type StorageAdapter } from "@/src/auth/storage-core";

export function createNativeSecureStorage(): StorageAdapter {
  return createChunkedStorage({
    async getItem(key: string) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    async setItem(key: string, value: string) {
      await SecureStore.setItemAsync(key, value);
    },
    async removeItem(key: string) {
      await SecureStore.deleteItemAsync(key);
    },
  });
}
