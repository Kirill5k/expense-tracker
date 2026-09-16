import { describe, expect, it } from "vitest";
import { filterTransactions, transactionTotals } from "./selectors";
import type { Transaction } from "./types";
import type { Category } from "@/features/categories/types";
const groceries: Category = {
  id: "food",
  name: "Groceries",
  kind: "expense",
  icon: "mdi-basket",
  color: "#123456",
};
const salary: Category = { ...groceries, id: "salary", name: "Salary", kind: "income" };
const account = { id: "main", name: "Main", currency: { code: "GBP", symbol: "£" }, isMain: true };
const base: Transaction = {
  id: "1",
  categoryId: "food",
  accountId: null,
  amount: { value: 0.1, currency: account.currency },
  date: "2026-09-15",
  note: "Weekly shop",
  tags: ["essentials"],
  parentTransactionId: null,
  isRecurring: false,
};
const select = (transactions: Transaction[]) =>
  filterTransactions(transactions, [groceries, salary], [account], {
    currency: "GBP",
    futureDays: 0,
    currentDay: "2026-09-15",
  });
describe("transaction visibility and totals", () => {
  it("excludes hidden parents, other currencies and future records while retaining unassigned", () => {
    const input = [
      base,
      { ...base, id: "2", categoryId: "hidden" },
      { ...base, id: "3", accountId: "archived" },
      { ...base, id: "4", amount: { value: 12, currency: { code: "USD", symbol: "$" } } },
      { ...base, id: "5", date: "2026-09-16" },
    ];
    expect(select(input).map((tx) => tx.id)).toEqual(["1"]);
  });
  it("combines account, keyword, amount, category and kind filters", () => {
    const selected = filterTransactions(
      [base, { ...base, id: "2", accountId: "main" }],
      [groceries],
      [account],
      {
        currency: "GBP",
        account: "unassigned",
        kind: "expense",
        category: "food",
        search: "GROCERIES, essentials shop",
        min: "0.10",
        max: "0.10",
        futureDays: null,
      },
    );
    expect(selected.map((tx) => tx.id)).toEqual(["1"]);
  });
  it("uses category signs and integer sums", () => {
    expect(
      transactionTotals(
        select([
          base,
          { ...base, id: "2", amount: { ...base.amount, value: 0.2 } },
          { ...base, id: "3", categoryId: "salary", amount: { ...base.amount, value: 1 } },
        ]),
      ),
    ).toEqual({ income: 100, expense: 30, net: 70 });
  });
  it("refuses to aggregate different currencies", () => {
    expect(() =>
      transactionTotals([
        base,
        { ...base, amount: { value: 1, currency: { code: "USD", symbol: "$" } } },
      ]),
    ).toThrow("one currency");
  });
});
