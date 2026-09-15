const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function toMoneyString(input: string | number): string {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) {
      throw new Error("Invalid money value");
    }
    const cents = Math.round(input * 100);
    const negative = cents < 0;
    const abs = Math.abs(cents);
    const whole = Math.floor(abs / 100);
    const fraction = String(abs % 100).padStart(2, "0");
    return `${negative ? "-" : ""}${whole}.${fraction}`;
  }

  const trimmed = input.trim();
  if (!MONEY_PATTERN.test(trimmed)) {
    throw new Error("Invalid money value");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export function formatMoney(value: string | null | undefined): string {
  if (!value) return "0.00";
  return toMoneyString(value);
}

/** Display rupees from catalog/order decimal strings. Never use float math. */
export function formatInr(value: string | number): string {
  const money = toMoneyString(value);
  const [whole, fraction = "00"] = money.split(".");
  const grouped = Number.parseInt(whole ?? "0", 10).toLocaleString("en-IN");
  if (fraction === "00") return `₹${grouped}`;
  return `₹${grouped}.${fraction}`;
}

export function formatInrFromMinor(minor: number): string {
  return formatInr(minorToMoney(minor));
}

/** Integer paise/cents. Catalog money is numeric(12,2); never use float arithmetic. */
export function moneyToMinor(value: string | number): number {
  const money = toMoneyString(value);
  const [whole, fraction] = money.split(".");
  return Number.parseInt(whole ?? "0", 10) * 100 + Number.parseInt(fraction ?? "0", 10);
}

export function minorToMoney(minor: number): string {
  if (!Number.isInteger(minor) || !Number.isFinite(minor) || minor < 0) {
    throw new Error("Invalid money value");
  }
  const whole = Math.trunc(minor / 100);
  const fraction = String(minor % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function lineTotalMinor(unitMinor: number, quantity: number): number {
  if (!Number.isInteger(unitMinor) || !Number.isInteger(quantity) || unitMinor < 0 || quantity < 0) {
    throw new Error("Invalid money value");
  }
  return unitMinor * quantity;
}
