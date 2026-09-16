import { useCallback, useEffect, useState } from "react";

import { userFacingApiMessage } from "@/src/api/errors";
import type { AddressDto, AddressWrite } from "@/src/api/types/addresses";
import { addressService, type AddressResult } from "@/src/services/address.service";
import { useAuth } from "@/src/auth/auth-context";

export function useAddresses() {
  const { session } = useAuth();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setAddresses([]);
      setAuthRequired(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await addressService.list();
    if (result.status === "success") {
      setAddresses(result.data);
      setAuthRequired(false);
    } else if (result.status === "auth_required") {
      setAddresses([]);
      setAuthRequired(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = useCallback(
    async (action: () => Promise<AddressResult<unknown>>) => {
      setMutating(true);
      setError(null);
      const result = await action();
      if (result.status === "success") {
        await load();
      } else if (result.status === "auth_required") {
        setAuthRequired(true);
      } else if (result.status === "error") {
        setError(userFacingApiMessage(new Error(result.message)));
      }
      setMutating(false);
      return result;
    },
    [load],
  );

  return {
    addresses,
    loading,
    authRequired,
    error,
    mutating,
    refresh: load,
    create: (input: AddressWrite) => mutate(() => addressService.create(input)),
    update: (id: string, input: Partial<AddressWrite>) =>
      mutate(() => addressService.update(id, input)),
    remove: (id: string) => mutate(() => addressService.remove(id)),
  };
}
