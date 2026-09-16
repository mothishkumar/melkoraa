import { createChunkedStorage, type StorageAdapter } from "@/src/auth/storage-core";

export function resolveWebStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    const probeKey = "__melkoraa_storage_probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return localStorage;
  } catch {
    return null;
  }
}

export function createWebStorage(storage: Storage | null = resolveWebStorage()): StorageAdapter {
  return createChunkedStorage({
    getItem(key: string) {
      if (!storage) return null;
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      if (!storage) return;
      try {
        storage.setItem(key, value);
      } catch {
        // QuotaExceededError or private-mode restrictions.
      }
    },
    removeItem(key: string) {
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch {
        // Ignore unavailable storage during cleanup.
      }
    },
  });
}
