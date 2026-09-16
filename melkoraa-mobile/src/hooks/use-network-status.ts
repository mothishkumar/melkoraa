import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

function isOnline(state: NetInfoState | null): boolean {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(isOnline(state));
    });

    NetInfo.fetch().then((state) => {
      setOnline(isOnline(state));
    });

    return unsubscribe;
  }, []);

  return { online, offline: !online };
}
