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
