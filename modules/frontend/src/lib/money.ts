export type Currency = { code: string; symbol: string };
export type Money = { value: number; currency: Currency };

export const currencies: Currency[] = [
  ["GBP", "£"],
  ["USD", "$"],
  ["EUR", "€"],
  ["ARS", "$"],
  ["AUD", "A$"],
  ["BRL", "R$"],
  ["CAD", "CA$"],
  ["CLP", "$"],
  ["CNY", "¥"],
  ["CZK", "Kč"],
  ["DKK", "kr"],
  ["HKD", "HK$"],
  ["INR", "₹"],
  ["JPY", "¥"],
  ["MYR", "RM"],
  ["MXN", "$"],
  ["NAD", "N$"],
  ["NZD", "NZ$"],
  ["NOK", "kr"],
  ["RUB", "₽"],
  ["ZAR", "R"],
  ["KRW", "₩"],
  ["SEK", "kr"],
  ["CHF", "Fr"],
  ["TRY", "₺"],
].map(([code, symbol]) => ({ code, symbol }));

export function currencyFor(code: string): Currency {
  return currencies.find((currency) => currency.code === code) ?? { code, symbol: code };
}

// The API uses two decimal places for every currency, including JPY.
export function toMinor(value: number | string): number {
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d{0,2}))?$/);
  if (!match) throw new Error("Enter an amount with at most two decimal places.");
  const result =
    (Number(match[2]) * 100 + Number((match[3] ?? "").padEnd(2, "0"))) * (match[1] ? -1 : 1);
  if (!Number.isSafeInteger(result)) throw new Error("This amount is too large.");
  return result;
}

export function formatMoney(minor: number, code: string, compact = false): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...(compact ? { notation: "compact" as const } : {}),
  }).format(minor / 100);
}
