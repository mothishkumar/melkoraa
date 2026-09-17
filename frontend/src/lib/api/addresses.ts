import { apiRequest } from "@/lib/api/client";
import type { AddressDto, AddressWrite } from "@/types/addresses";

export function createAddressRequest(body: AddressWrite) {
  return apiRequest<AddressDto>("/api/v1/addresses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAddressRequest(addressId: string, body: Partial<AddressWrite>) {
  return apiRequest<AddressDto>(`/api/v1/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAddressRequest(addressId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/addresses/${addressId}`, {
    method: "DELETE",
  });
}
