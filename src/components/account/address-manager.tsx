"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAddressRequest, deleteAddressRequest } from "@/lib/api/addresses";
import { userFacingApiMessage } from "@/lib/api/client";
import type { AddressDto } from "@/types/addresses";

export function AddressManager({ addresses }: { addresses: AddressDto[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ul className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-sm text-stone">No addresses saved.</p>
        ) : null}
        {addresses.map((address) => (
          <li key={address.id} className="border border-black/15 bg-white p-5 text-sm leading-6">
            {address.isDefault ? <p className="label-caps mb-2">Default</p> : null}
            <p>{address.name}</p>
            <p className="text-stone">
              {address.addressLine1}
              <br />
              {address.city}, {address.state} {address.postalCode}
            </p>
            <button
              type="button"
              className="label-caps mt-4 text-[0.6rem]"
              onClick={async () => {
                setError(null);
                try {
                  await deleteAddressRequest(address.id);
                  router.refresh();
                } catch (caught) {
                  setError(userFacingApiMessage(caught));
                }
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          try {
            await createAddressRequest({
              ...form,
              phone: form.phone || undefined,
              isDefault: addresses.length === 0,
            });
            router.refresh();
          } catch (caught) {
            setError(userFacingApiMessage(caught));
          } finally {
            setPending(false);
          }
        }}
      >
        {Object.entries({
          name: "Name",
          phone: "Phone",
          addressLine1: "Address",
          city: "City",
          state: "State",
          postalCode: "Postal code",
          country: "Country",
        }).map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={key} className="label-caps text-[0.6rem]">
              {label}
            </Label>
            <Input
              id={key}
              required={key !== "phone"}
              className="mt-2 h-12 rounded-none bg-transparent"
              value={form[key as keyof typeof form]}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, [key]: event.target.value }))
              }
            />
          </div>
        ))}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={pending} className="h-12 w-full rounded-none">
          {pending ? "Saving" : "Save address"}
        </Button>
      </form>
    </div>
  );
}
