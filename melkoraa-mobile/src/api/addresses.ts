import { apiRequest } from "@/src/api/client";
import type { AddressDto, AddressWrite } from "@/src/api/types/addresses";

export const addressesApi = {
  list() {
    return apiRequest<AddressDto[]>("/addresses", { authenticated: true });
  },

  create(input: AddressWrite) {
    return apiRequest<AddressDto>("/addresses", {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: true,
    });
  },

  update(addressId: string, input: Partial<AddressWrite>) {
    return apiRequest<AddressDto>(`/addresses/${encodeURIComponent(addressId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      authenticated: true,
    });
  },

  remove(addressId: string) {
    return apiRequest<{ deleted: boolean }>(
      `/addresses/${encodeURIComponent(addressId)}`,
      {
        method: "DELETE",
        authenticated: true,
      },
    );
  },
};
