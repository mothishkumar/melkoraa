export const CHUNK_SIZE = 1800;

export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export function chunkKey(key: string, index: number): string {
  return `${key}_${index}`;
}

type SyncStorageBackend = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type AsyncStorageBackend = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

function parseChunkCount(marker: string | null): number | null {
  if (!marker?.startsWith("chunked:")) return null;
  const count = Number(marker.replace("chunked:", ""));
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
}

export function createChunkedStorage(
  backend: SyncStorageBackend | AsyncStorageBackend,
): StorageAdapter {
  const read = (key: string) => Promise.resolve(backend.getItem(key));
  const write = (key: string, value: string) =>
    Promise.resolve(backend.setItem(key, value));
  const remove = (key: string) => Promise.resolve(backend.removeItem(key));

  return {
    async getItem(key: string): Promise<string | null> {
      try {
        const first = await read(key);
        if (first === null) return null;

        if (first.startsWith("chunked:")) {
          const count = parseChunkCount(first);
          if (count === null) return null;

          const parts: string[] = [];
          for (let i = 0; i < count; i += 1) {
            const part = await read(chunkKey(key, i));
            if (part === null) return null;
            parts.push(part);
          }
          return parts.join("");
        }

        return first;
      } catch {
        return null;
      }
    },

    async setItem(key: string, value: string): Promise<void> {
      try {
        if (value.length <= CHUNK_SIZE) {
          await write(key, value);
          return;
        }

        const chunks = Math.ceil(value.length / CHUNK_SIZE);
        await write(key, `chunked:${chunks}`);
        for (let i = 0; i < chunks; i += 1) {
          const part = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await write(chunkKey(key, i), part);
        }
      } catch {
        // Private mode / quota errors should not crash auth bootstrap.
      }
    },

    async removeItem(key: string): Promise<void> {
      try {
        const marker = await read(key);
        const count = parseChunkCount(marker);
        if (count !== null) {
          for (let i = 0; i < count; i += 1) {
            await remove(chunkKey(key, i));
          }
        }
        await remove(key);
      } catch {
        // Ignore cleanup failures on unavailable storage.
      }
    },
  };
}
