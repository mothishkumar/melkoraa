import { formatPrice, isOnSale } from "@/src/utils/format";

describe("formatPrice", () => {
  it("formats INR whole amounts", () => {
    expect(formatPrice("1499.00")).toBe("₹1,499");
  });

  it("formats INR with decimals when needed", () => {
    expect(formatPrice("1499.50")).toBe("₹1,499.50");
  });
});

describe("isOnSale", () => {
  it("detects sale when compare price is higher", () => {
    expect(isOnSale("999.00", "1299.00")).toBe(true);
  });

  it("returns false without compare price", () => {
    expect(isOnSale("999.00", null)).toBe(false);
  });
});
