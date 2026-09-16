jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from "expo-secure-store";
import { createNativeSecureStorage } from "@/src/auth/native-secure-storage";

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
import { createWebStorage, resolveWebStorage } from "@/src/auth/web-storage";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("web storage", () => {
  it("get/set/remove values via localStorage-style fallback", async () => {
    const storage = createWebStorage(createMemoryStorage());

    await storage.setItem("session", "token-a");
    await expect(storage.getItem("session")).resolves.toBe("token-a");

    await storage.removeItem("session");
    await expect(storage.getItem("session")).resolves.toBeNull();
  });

  it("returns null when storage is unavailable", async () => {
    const storage = createWebStorage(null);

    await expect(storage.getItem("missing")).resolves.toBeNull();
    await expect(storage.setItem("missing", "value")).resolves.toBeUndefined();
    await expect(storage.removeItem("missing")).resolves.toBeUndefined();
  });

  it("returns null for malformed chunked markers", async () => {
    const memory = createMemoryStorage();
    memory.setItem("broken", "chunked:not-a-number");
    const storage = createWebStorage(memory);

    await expect(storage.getItem("broken")).resolves.toBeNull();
  });

  it("handles private-mode style set failures without throwing", async () => {
    const storage = createWebStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
      clear: () => undefined,
      key: () => null,
      length: 0,
    });

    await expect(storage.setItem("session", "value")).resolves.toBeUndefined();
    await expect(storage.getItem("session")).resolves.toBeNull();
    await expect(storage.removeItem("session")).resolves.toBeUndefined();
  });
});

describe("native secure storage", () => {
  beforeEach(() => {
    mockSecureStore.getItemAsync.mockReset();
    mockSecureStore.setItemAsync.mockReset();
    mockSecureStore.deleteItemAsync.mockReset();
  });

  it("uses expo-secure-store for get/set/remove", async () => {
    mockSecureStore.getItemAsync.mockResolvedValue("native-token");
    const storage = createNativeSecureStorage();

    await expect(storage.getItem("session")).resolves.toBe("native-token");
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("session");

    await storage.setItem("session", "next-token");
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("session", "next-token");

    mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
      if (key === "chunked") return "chunked:1";
      if (key === "chunked_0") return "part";
      return null;
    });

    await expect(storage.getItem("chunked")).resolves.toBe("part");

    mockSecureStore.getItemAsync.mockResolvedValue(null);
    await storage.removeItem("session");
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("session");
  });

  it("returns null when secure store read fails", async () => {
    mockSecureStore.getItemAsync.mockRejectedValue(new Error("Keychain unavailable"));
    const storage = createNativeSecureStorage();

    await expect(storage.getItem("session")).resolves.toBeNull();
  });
});

describe("resolveWebStorage", () => {
  it("returns null when localStorage is missing", () => {
    const original = global.localStorage;
    // @ts-expect-error test override
    delete global.localStorage;

    expect(resolveWebStorage()).toBeNull();

    global.localStorage = original;
  });
});
