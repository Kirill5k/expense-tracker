import { describe, expect, it } from "vitest";
import type { Transaction } from "@/features/transactions/types";
import { currencyFor } from "./money";
import { reportCurrency } from "./report-currency";

const main = { id: "main", name: "Main", currency: currencyFor("GBP"), isMain: true };
const travel = { id: "travel", name: "Travel", currency: currencyFor("EUR"), isMain: false };
const record = (accountId: string | null, code: string): Transaction => ({
  id: `${accountId}-${code}`,
  accountId,
  categoryId: "food",
  amount: { value: 10, currency: currencyFor(code) },
  date: "2026-09-15",
  note: null,
  tags: [],
  parentTransactionId: null,
  isRecurring: false,
});
const defaults = {
  currency: "GBP",
  defaultCurrency: "GBP",
  account: "",
  accounts: [main, travel],
  transactions: [],
};

describe("account-aware reporting currency", () => {
  it("keeps All accounts selected for a new single-currency account", () => {
    expect(reportCurrency({ ...defaults, accounts: [main] })).toEqual({
      account: "",
      currency: "GBP",
      currencyOptions: ["GBP"],
    });
  });
  it("uses the selected account currency even when the URL retains a different currency", () => {
    expect(reportCurrency({ ...defaults, account: travel.id })).toEqual({
      account: travel.id,
      currency: "EUR",
      currencyOptions: ["EUR"],
    });
  });
  it("keeps all-account totals separated by currencies actually used", () => {
    expect(
      reportCurrency({ ...defaults, transactions: [record(null, "USD")] }).currencyOptions,
    ).toEqual(["GBP", "EUR", "USD"]);
  });
  it("keeps legacy currencies accessible on an account without including other accounts", () => {
    expect(
      reportCurrency({
        ...defaults,
        account: main.id,
        currency: "USD",
        transactions: [record(main.id, "USD"), record(travel.id, "EUR")],
      }),
    ).toEqual({ account: main.id, currency: "USD", currencyOptions: ["GBP", "USD"] });
  });
  it("uses the settings currency for No account even with a stale currency filter", () => {
    expect(
      reportCurrency({
        ...defaults,
        account: "unassigned",
        currency: "EUR",
        defaultCurrency: "USD",
        transactions: [record(null, "EUR"), record(main.id, "USD")],
      }),
    ).toEqual({ account: "unassigned", currency: "USD", currencyOptions: ["USD"] });
  });
  it.each(["", "unassigned", "missing", main.id])(
    "uses No account and the settings currency when no accounts exist (filter %s)",
    (account) => {
      expect(
        reportCurrency({
          ...defaults,
          account,
          currency: "EUR",
          defaultCurrency: "USD",
          accounts: [],
          transactions: [record(null, "EUR"), record(main.id, "GBP")],
        }),
      ).toEqual({ account: "unassigned", currency: "USD", currencyOptions: ["USD"] });
    },
  );
  it("falls back to All accounts when a saved account is no longer visible", () => {
    expect(reportCurrency({ ...defaults, account: "missing" })).toEqual({
      account: "",
      currency: "GBP",
      currencyOptions: ["GBP", "EUR"],
    });
  });
  it("uses the latest settings currency for No account", () => {
    const before = reportCurrency({ ...defaults, account: "unassigned" });
    expect(reportCurrency({ ...defaults, ...before, defaultCurrency: "EUR" })).toEqual({
      account: "unassigned",
      currency: "EUR",
      currencyOptions: ["EUR"],
    });
  });
  it("supports recurring records without transaction-only fields", () => {
    expect(
      reportCurrency({
        ...defaults,
        transactions: [{ accountId: null, amount: { currency: { code: "USD" } } }],
      }).currencyOptions,
    ).toEqual(["GBP", "EUR", "USD"]);
  });
});
