import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { addressBodySchema } from "@/lib/validation/addresses";
import {
  createCustomerAddress,
  listCustomerAddresses,
} from "@/server/services/addresses/address-service";

export async function GET() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return handleApi(async () => jsonOk(await listCustomerAddresses(auth.user.id)));
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return handleApi(async () => {
    const body = addressBodySchema.parse(await readJsonBody(request));
    const address = await createCustomerAddress(auth.user.id, {
      name: body.name,
      phone: body.phone,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2 || undefined,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      isDefault: body.isDefault,
    });
    return jsonOk(address, 201);
  });
}
