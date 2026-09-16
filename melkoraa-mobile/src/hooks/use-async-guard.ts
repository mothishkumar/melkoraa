import { useCallback, useRef, useState } from "react";

export function createAsyncGuard() {
  let locked = false;

  return {
    isLocked() {
      return locked;
    },
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      if (locked) return undefined;
      locked = true;
      try {
        return await fn();
      } finally {
        locked = false;
      }
    },
  };
}

export function useAsyncGuard() {
  const guardRef = useRef(createAsyncGuard());
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (guardRef.current.isLocked()) return undefined;
    setBusy(true);
    try {
      return await guardRef.current.run(fn);
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, run };
}
