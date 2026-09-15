import { getDb } from "@/db";
import { logger } from "@/lib/logger";
import { notFoundError } from "@/server/errors";
import * as addressRepo from "@/server/repositories/addresses/address-repository";
import type { AddressDto } from "@/types/addresses";

function mapAddress(row: NonNullable<Awaited<ReturnType<typeof addressRepo.findAddressForUser>>>): AddressDto {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    isDefault: row.isDefault,
  };
}

export type AddressInput = {
  name: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export async function listCustomerAddresses(userId: string): Promise<AddressDto[]> {
  const rows = await addressRepo.listAddressesForUser(userId);
  return rows.map(mapAddress);
}

export async function createCustomerAddress(userId: string, input: AddressInput): Promise<AddressDto> {
  const existing = await addressRepo.listAddressesForUser(userId);
  const makeDefault = input.isDefault === true || existing.length === 0;
  const db = getDb();
  const row = await db.transaction(async (tx) => {
    if (makeDefault) {
      await addressRepo.clearDefaultAddresses(userId, tx);
    }
    return addressRepo.insertAddress(
      {
        userId,
        name: input.name,
        phone: input.phone ?? null,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        isDefault: makeDefault,
      },
      tx,
    );
  });
  logger.info("address.created", { actorId: userId, resourceId: row.id });
  return mapAddress(row);
}

export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>,
): Promise<AddressDto> {
  const current = await addressRepo.findAddressForUser(userId, addressId);
  if (!current) {
    throw notFoundError("ADDRESS_NOT_FOUND", "Address was not found.");
  }
  const db = getDb();
  const row = await db.transaction(async (tx) => {
    if (input.isDefault === true) {
      await addressRepo.clearDefaultAddresses(userId, tx);
    }
    return addressRepo.updateAddressRow(
      userId,
      addressId,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
        ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 || null } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.isDefault === true ? { isDefault: true } : {}),
      },
      tx,
    );
  });
  if (!row) {
    throw notFoundError("ADDRESS_NOT_FOUND", "Address was not found.");
  }
  logger.info("address.updated", { actorId: userId, resourceId: addressId });
  return mapAddress(row);
}

export async function deleteCustomerAddress(userId: string, addressId: string) {
  const deleted = await addressRepo.deleteAddressRow(userId, addressId);
  if (!deleted) {
    throw notFoundError("ADDRESS_NOT_FOUND", "Address was not found.");
  }
  logger.info("address.deleted", { actorId: userId, resourceId: addressId });
  return { deleted: true };
}
