import { describe, expect, it } from "vitest";
import type { Transaction } from "@/features/transactions/types";
import { accountActivity } from "./activity";

const transaction = (
  value: number,
  currency: string,
  kind: "income" | "expense",
  accountId: string | null = "account",
): Transaction => ({
  id: String(value),
  accountId,
  categoryId: kind,
  parentTransactionId: null,
  isRecurring: false,
  date: "2026-09-15",
  note: null,
  tags: [],
  amount: { value, currency: { code: currency, symbol: currency } },
  category: { id: kind, name: kind, kind, color: "#2254F4", icon: "shape" },
});
describe("account activity", () => {
  it("keeps original currencies separate and uses exact minor units", () => {
    const values = accountActivity(
      "account",
      [
        transaction(10, "GBP", "income"),
        transaction(0.1, "GBP", "expense"),
        transaction(0.2, "GBP", "expense"),
        transaction(20, "EUR", "income"),
      ],
      [],
      "GBP",
    );
    expect(
      values.map(({ currency, income, expenses, net }) => ({ currency, income, expenses, net })),
    ).toEqual([
      { currency: "GBP", income: 1000, expenses: 30, net: 970 },
      { currency: "EUR", income: 2000, expenses: 0, net: 2000 },
    ]);
  });
  it("includes unassigned records only in unassigned activity", () => {
    const values = [transaction(5, "GBP", "income", null), transaction(12, "GBP", "expense")];
    expect(accountActivity(null, values, [])[0].net).toBe(500);
    expect(accountActivity("account", values, [])[0].net).toBe(-1200);
  });
  it("retains an empty account currency and excludes unresolved categories from financial totals", () => {
    const item = { ...transaction(5, "EUR", "expense"), category: null };
    expect(accountActivity("account", [item], [], "GBP")).toEqual([
      { currency: "GBP", income: 0, expenses: 0, net: 0, count: 0, unclassified: 0 },
      { currency: "EUR", income: 0, expenses: 0, net: 0, count: 1, unclassified: 1 },
    ]);
  });
});
