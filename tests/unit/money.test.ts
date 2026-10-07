import { describe, it, expect } from "vitest";
import { round2, formatMoney, toNumber } from "@/lib/money";

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
    expect(round2(19.999)).toBeCloseTo(20.0, 2);
    expect(round2(1.005)).toBeCloseTo(1.01, 2);
  });

  it("avoids floating point drift on repeated addition", () => {
    let total = 0;
    for (let i = 0; i < 3; i++) {
      total = round2(total + 0.1);
    }
    expect(total).toBe(0.3);
  });
});

describe("toNumber", () => {
  it("converts Decimal-like objects and strings to numbers", () => {
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber(5)).toBe(5);
    expect(toNumber({ toString: () => "3.14" })).toBe(3.14);
  });
});

describe("formatMoney", () => {
  it("formats with the given currency symbol and 2 decimals", () => {
    expect(formatMoney(1200, "₦")).toBe("₦1,200.00");
    expect(formatMoney("1200.5", "$")).toBe("$1,200.50");
  });
});
