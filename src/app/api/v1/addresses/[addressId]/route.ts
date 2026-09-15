import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateAddressBodySchema, uuidSchema } from "@/lib/validation/addresses";
import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@/server/services/addresses/address-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ addressId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return handleApi(async () => {
    const { addressId } = await context.params;
    uuidSchema.parse(addressId);
    const body = updateAddressBodySchema.parse(await readJsonBody(request));
    const address = await updateCustomerAddress(auth.user.id, addressId, {
      ...body,
      addressLine2: body.addressLine2 || undefined,
    });
    return jsonOk(address);
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ addressId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return handleApi(async () => {
    const { addressId } = await context.params;
    uuidSchema.parse(addressId);
    return jsonOk(await deleteCustomerAddress(auth.user.id, addressId));
  });
}
