import { describe, expect, it } from "vitest";
import {
  nextOccurrence,
  recurringInput,
  recurringSchema,
  type RecurringValues,
} from "./validation";
import type { Recurring } from "./types";
import type { Account } from "@/features/accounts/types";

const accounts: Account[] = [
  { id: "main", name: "Everyday", currency: { code: "GBP", symbol: "£" }, isMain: true },
  { id: "travel", name: "Travel", currency: { code: "EUR", symbol: "€" }, isMain: false },
];

const values: RecurringValues = {
  kind: "expense",
  amount: "12.50",
  categoryId: "category",
  accountId: "",
  note: "Subscription",
  tags: "monthly, personal",
  startDate: "2026-09-15",
  endDate: "",
  interval: "1",
  frequency: "monthly",
};

const original: Recurring = {
  id: "schedule",
  categoryId: "category",
  accountId: null,
  amount: { value: 12.5, currency: { code: "EUR", symbol: "€" } },
  recurrence: {
    startDate: "2026-09-15",
    nextDate: "2026-10-15",
    endDate: null,
    interval: 1,
    frequency: "monthly",
  },
  note: null,
  tags: [],
};

describe("recurring validation", () => {
  it("accepts an open-ended schedule and rejects invalid date-only values", () => {
    expect(recurringSchema.safeParse(values).success).toBe(true);
    expect(recurringSchema.safeParse({ ...values, startDate: "2026-02-30" }).success).toBe(false);
    expect(recurringSchema.safeParse({ ...values, endDate: "2026-09-16T00:00:00Z" }).success).toBe(
      false,
    );
  });
  it.each(["2026-09-14", "2026-09-15"])(
    "rejects exclusive end date %s at or before the start",
    (endDate) => {
      const result = recurringSchema.safeParse({ ...values, endDate });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.flatten().fieldErrors.endDate).toContain(
          "The end date must be after the start date.",
        );
    },
  );
  it.each(["0", "-1", "1.5", "", "2147483648"])("rejects invalid interval %s", (interval) => {
    expect(recurringSchema.safeParse({ ...values, interval }).success).toBe(false);
  });
  it("allows one amount and rejects batch entry or non-positive amounts", () => {
    for (const amount of ["10, 20", "10;20", "10\n20", "0", "-5", "1.001"])
      expect(recurringSchema.safeParse({ ...values, amount }).success).toBe(false);
  });
  it("preserves the original edit currency and recurrence checkpoint", () => {
    const input = recurringInput({ ...values, accountId: "main" }, accounts, "USD", original);
    expect(input.amount.currency).toEqual(original.amount.currency);
    expect(input.recurrence.nextDate).toBe(original.recurrence.nextDate);
    expect(input.accountId).toBe("main");
  });
  it("derives new schedules' currency from the selected account", () => {
    const input = recurringInput({ ...values, accountId: "travel" }, accounts, "GBP");
    expect(input.accountId).toBe("travel");
    expect(input.amount.currency).toEqual(accounts[1].currency);
  });
  it("creates schedules with no account using profile currency and no generation checkpoint", () => {
    expect(recurringInput(values, accounts, "USD")).toMatchObject({
      accountId: null,
      amount: { currency: { code: "USD", symbol: "$" } },
      recurrence: { nextDate: null, endDate: null },
      tags: ["monthly", "personal"],
    });
  });
  it("ignores a stale currency field when creating without an account", () => {
    const parsed = recurringSchema.parse({ ...values, currency: "EUR" });
    expect(recurringInput(parsed, accounts, "USD").amount.currency.code).toBe("USD");
  });
  it("preserves an existing no-account schedule's currency when the profile changes", () => {
    const input = recurringInput(values, accounts, "USD", original);
    expect(input.accountId).toBeNull();
    expect(input.amount.currency).toEqual(original.amount.currency);
  });
});

describe("next occurrence", () => {
  it("treats the end date as exclusive", () => {
    expect(nextOccurrence({ ...original.recurrence, endDate: "2026-10-15" }, "2026-10-01")).toEqual(
      { date: null, status: "ended" },
    );
  });
  it("retains overdue dates awaiting backend generation even after the end date", () => {
    expect(nextOccurrence({ ...original.recurrence, endDate: "2026-10-16" }, "2026-10-20")).toEqual(
      { date: "2026-10-15", status: "due" },
    );
  });
  it("uses the start date until the backend has assigned its first checkpoint", () => {
    expect(nextOccurrence({ ...original.recurrence, nextDate: null }, "2026-09-14")).toEqual({
      date: "2026-09-15",
      status: "scheduled",
    });
  });
});
