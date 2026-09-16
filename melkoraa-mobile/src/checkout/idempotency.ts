import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { checkoutStorageKey } from "@/src/checkout/contract";

export async function readIdempotencyKey(userId: string): Promise<string> {
  const key = checkoutStorageKey(userId);
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const created = Crypto.randomUUID();
  await AsyncStorage.setItem(key, created);
  return created;
}

export async function clearIdempotencyKey(userId: string): Promise<void> {
  await AsyncStorage.removeItem(checkoutStorageKey(userId));
}
