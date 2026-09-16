import { describe, expect, it } from "vitest";
import type { Account } from "@/features/accounts/types";
import { entryCurrency, initialAccountId } from "./account-currency";

const accounts: Account[] = [
  { id: "main", name: "Everyday", currency: { code: "GBP", symbol: "£" }, isMain: true },
  { id: "travel", name: "Travel", currency: { code: "EUR", symbol: "€" }, isMain: false },
];

describe("entry account and currency", () => {
  it("uses a new entry's selected account instead of the profile currency", () => {
    expect(entryCurrency({ accountId: "travel" }, accounts, "GBP")).toEqual(accounts[1].currency);
  });

  it("uses the profile default when creating without an account", () => {
    expect(entryCurrency({ accountId: "" }, accounts, "USD")).toEqual({
      code: "USD",
      symbol: "$",
    });
  });

  it.each(["main", "travel", ""])(
    "preserves the complete recorded currency while editing with account %s",
    (accountId) => {
      const original = { code: "EUR", symbol: "Legacy €" };
      expect(entryCurrency({ accountId }, accounts, "USD", original)).toBe(original);
    },
  );

  it("suggests the main account only when its currency matches the profile", () => {
    expect(initialAccountId(accounts, "GBP")).toBe("main");
    expect(initialAccountId(accounts, "EUR")).toBe("");
    expect(initialAccountId([], "GBP")).toBe("");
  });

  it("retains a historical no-account choice instead of assigning the main account", () => {
    expect(initialAccountId(accounts, "GBP", { accountId: null })).toBe("");
  });

  it("retains an existing assignment even when its currency differs or account is unavailable", () => {
    expect(initialAccountId(accounts, "GBP", { accountId: "travel" })).toBe("travel");
    expect(initialAccountId(accounts, "GBP", { accountId: "missing" })).toBe("missing");
  });
});
