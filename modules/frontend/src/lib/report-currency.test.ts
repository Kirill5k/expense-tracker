import { describe, expect, it } from "vitest";
import { currencyFor } from "./money";
import { reportCurrency } from "./report-currency";

const main = { id: "main", name: "Main", currency: currencyFor("GBP"), isMain: true };
const travel = { id: "travel", name: "Travel", currency: currencyFor("EUR"), isMain: false };
const savings = { id: "savings", name: "Savings", currency: currencyFor("USD"), isMain: false };
const defaults = {
  defaultCurrency: "GBP",
  accounts: [travel, main],
};

describe("account-aware reporting currency", () => {
  it.each([undefined, "", "unassigned", "archived-account"])(
    "selects the visible main account for an absent or unavailable selection (%s)",
    (account) => {
      expect(reportCurrency({ ...defaults, account })).toEqual({
        account: main.id,
        currency: "GBP",
      });
    },
  );

  it("uses the explicitly selected account and its currency ahead of the main account", () => {
    expect(reportCurrency({ ...defaults, account: travel.id, defaultCurrency: "USD" })).toEqual({
      account: travel.id,
      currency: "EUR",
    });
  });

  it("selects the first visible account when there is no visible main account", () => {
    expect(reportCurrency({ ...defaults, accounts: [travel, savings], account: main.id })).toEqual({
      account: travel.id,
      currency: "EUR",
    });
  });

  it.each([undefined, "", "unassigned", main.id])(
    "uses No account and the settings currency when no accounts exist (selection %s)",
    (account) => {
      expect(
        reportCurrency({ ...defaults, account, accounts: [], defaultCurrency: "USD" }),
      ).toEqual({ account: "unassigned", currency: "USD" });
    },
  );

  it("uses the updated settings currency while there are no accounts", () => {
    const before = reportCurrency({ ...defaults, accounts: [] });
    expect(
      reportCurrency({
        ...defaults,
        account: before.account,
        accounts: [],
        defaultCurrency: "EUR",
      }),
    ).toEqual({ account: "unassigned", currency: "EUR" });
  });

  it("selects an account when one becomes available after No account was selected", () => {
    const before = reportCurrency({ ...defaults, accounts: [] });
    expect(reportCurrency({ ...defaults, account: before.account, accounts: [travel] })).toEqual({
      account: travel.id,
      currency: "EUR",
    });
  });

  it("falls back to No account after the last visible account is archived", () => {
    const before = reportCurrency({ ...defaults, account: travel.id, accounts: [travel] });
    expect(reportCurrency({ ...defaults, account: before.account, accounts: [] })).toEqual({
      account: "unassigned",
      currency: "GBP",
    });
  });
});
