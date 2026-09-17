
import { useUiStore } from "@/hooks/use-ui-store";
import { useEffect } from "react";

export function BagCountSync({ count }: { count: number }) {
  useEffect(() => {
    useUiStore.setState({ bagCount: count });
  }, [count]);
  return null;
}
