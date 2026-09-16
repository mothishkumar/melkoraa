import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number) {
  return `${key}_${index}`;
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const first = await SecureStore.getItemAsync(key);
    if (first === null) return null;
    if (!first.startsWith("chunked:")) return first;

    const count = Number(first.replace("chunked:", ""));
    if (!Number.isFinite(count) || count <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(key, `chunked:${chunks}`);
    for (let i = 0; i < chunks; i += 1) {
      const part = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(chunkKey(key, i), part);
    }
  },

  async removeItem(key: string): Promise<void> {
    const marker = await SecureStore.getItemAsync(key);
    if (marker?.startsWith("chunked:")) {
      const count = Number(marker.replace("chunked:", ""));
      for (let i = 0; i < count; i += 1) {
        await SecureStore.deleteItemAsync(chunkKey(key, i));
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};
