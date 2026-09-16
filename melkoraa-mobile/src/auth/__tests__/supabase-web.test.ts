jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  AppState: {
    addEventListener: jest.fn(),
  },
}));

import { resetSecureStorageCache, secureStorage } from "@/src/auth/secure-storage";

const AUTH_STORAGE_KEY = "melkoraa.supabase.auth";

function installLocalStorage() {
  const memory = new Map<string, string>();
  Object.defineProperty(global, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return memory.size;
      },
      clear() {
        memory.clear();
      },
      getItem(key: string) {
        return memory.has(key) ? memory.get(key)! : null;
      },
      key(index: number) {
        return Array.from(memory.keys())[index] ?? null;
      },
      removeItem(key: string) {
        memory.delete(key);
      },
      setItem(key: string, value: string) {
        memory.set(key, value);
      },
    },
  });
}

describe("secure storage on web", () => {
  beforeEach(() => {
    installLocalStorage();
    resetSecureStorageCache();
  });

  it("initializes without expo-secure-store and supports auth session keys", async () => {
    await expect(secureStorage.getItem(AUTH_STORAGE_KEY)).resolves.toBeNull();
    await expect(
      secureStorage.setItem(AUTH_STORAGE_KEY, '{"access_token":"test-token"}'),
    ).resolves.toBeUndefined();
    await expect(secureStorage.getItem(AUTH_STORAGE_KEY)).resolves.toContain(
      "test-token",
    );
    await expect(secureStorage.removeItem(AUTH_STORAGE_KEY)).resolves.toBeUndefined();
  });
});
