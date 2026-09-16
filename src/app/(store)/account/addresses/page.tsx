import { StoreSurface } from "@/components/layout/store-surface";
import { AddressManager } from "@/components/account/address-manager";
import { requireAuth } from "@/lib/auth/require-auth";
import { listCustomerAddresses } from "@/server/services/addresses/address-service";

export const metadata = {
  title: "Addresses",
};

export default async function AccountAddressesPage() {
  const { user } = await requireAuth("/account/addresses");
  const addresses = await listCustomerAddresses(user.id);

  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <p className="label-caps">Addresses</p>
        <h1 className="editorial-display mt-4 text-4xl">Delivery</h1>
        <div className="mt-12">
          <AddressManager addresses={addresses} />
        </div>
      </div>
    </StoreSurface>
  );
}
