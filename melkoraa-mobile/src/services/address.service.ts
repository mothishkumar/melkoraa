import { addressesApi } from "@/src/api/addresses";
import { isAuthRequiredError } from "@/src/api/errors";
import type { AddressDto, AddressWrite } from "@/src/api/types/addresses";

export type AddressResult<T> =
  | { status: "success"; data: T }
  | { status: "auth_required" }
  | { status: "error"; message: string };

async function wrap<T>(fn: () => Promise<T>): Promise<AddressResult<T>> {
  try {
    return { status: "success", data: await fn() };
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return { status: "auth_required" };
    }
    const message =
      error instanceof Error ? error.message : "Unable to update addresses.";
    return { status: "error", message };
  }
}

export const addressService = {
  list(): Promise<AddressResult<AddressDto[]>> {
    return wrap(() => addressesApi.list());
  },

  create(input: AddressWrite): Promise<AddressResult<AddressDto>> {
    return wrap(() => addressesApi.create(input));
  },

  update(
    addressId: string,
    input: Partial<AddressWrite>,
  ): Promise<AddressResult<AddressDto>> {
    return wrap(() => addressesApi.update(addressId, input));
  },

  remove(addressId: string): Promise<AddressResult<{ deleted: boolean }>> {
    return wrap(() => addressesApi.remove(addressId));
  },
};
