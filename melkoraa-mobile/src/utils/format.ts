export function formatPrice(amount: string, currency = "INR"): string {
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(value)) return amount;
  if (currency === "INR") {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${currency} ${value.toFixed(2)}`;
}

export function isOnSale(basePrice: string, compareAtPrice: string | null): boolean {
  if (!compareAtPrice) return false;
  const base = Number.parseFloat(basePrice);
  const compare = Number.parseFloat(compareAtPrice);
  return Number.isFinite(base) && Number.isFinite(compare) && compare > base;
}
