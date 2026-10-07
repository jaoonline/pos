export function toNumber(value: number | string | { toString(): string }): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export function formatMoney(
  value: number | string | { toString(): string },
  currencySymbol = "₦"
): string {
  const amount = toNumber(value);
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currencySymbol}${formatted}`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
