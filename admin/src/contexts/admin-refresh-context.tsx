import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

type AdminRefreshContextValue = {
  tick: number;
  refresh: () => void;
};

export const AdminRefreshContext = createContext<AdminRefreshContextValue | null>(null);

export function AdminRefreshProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const value = useMemo(() => ({ tick, refresh }), [tick, refresh]);

  return <AdminRefreshContext.Provider value={value}>{children}</AdminRefreshContext.Provider>;
}
