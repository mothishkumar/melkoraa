import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "melkoraa.auth.pending-action";

export type PendingAddToCart = {
  type: "add_to_cart";
  variantId: string;
  quantity: number;
  returnPath: string;
};

export type PendingWishlistToggle = {
  type: "wishlist_toggle";
  productId: string;
  returnPath: string;
};

export type PendingAction = PendingAddToCart | PendingWishlistToggle;

export async function savePendingAction(action: PendingAction): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(action));
}

export async function consumePendingAction(): Promise<PendingAction | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as PendingAction;
  } catch {
    return null;
  }
}

export async function clearPendingAction(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
