import type { Category } from "@/features/categories/types";
import type { Account } from "@/features/accounts/types";
import { visibleDate } from "@/lib/dates";
import { toMinor } from "@/lib/money";
import type { Transaction } from "./types";
export type TransactionFilters = {
  currency?: string;
  account?: string;
  category?: string;
  kind?: string;
  search?: string;
  min?: string;
  max?: string;
  futureDays: number | null;
  currentDay?: string;
};

export function filterTransactions(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  filters: TransactionFilters,
): Transaction[] {
  const cats = new Map(categories.map((c) => [c.id, c]));
  const accountIds = new Set(accounts.map((a) => a.id));
  const words = (filters.search ?? "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  const bound = (value?: string) => {
    try {
      return value ? toMinor(value) : undefined;
    } catch {
      return undefined;
    }
  };
  const min = bound(filters.min),
    max = bound(filters.max);
  return transactions
    .filter((tx) => {
      const category = cats.get(tx.categoryId);
      if (!category || (tx.accountId && !accountIds.has(tx.accountId))) return false;
      if (filters.currency && tx.amount.currency.code !== filters.currency) return false;
      if (
        filters.account &&
        (filters.account === "unassigned"
          ? tx.accountId !== null
          : tx.accountId !== filters.account)
      )
        return false;
      if (filters.category && tx.categoryId !== filters.category) return false;
      if (filters.kind && category.kind !== filters.kind) return false;
      if (!visibleDate(tx.date, filters.futureDays, filters.currentDay)) return false;
      const amount = toMinor(tx.amount.value);
      if ((min !== undefined && amount < min) || (max !== undefined && amount > max)) return false;
      const text = `${category.name} ${tx.note ?? ""} ${tx.tags.join(" ")}`.toLowerCase();
      return words.every((word) => text.includes(word));
    })
    .map((tx) => ({ ...tx, category: cats.get(tx.categoryId)! }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function transactionTotals(transactions: Transaction[]) {
  let income = 0,
    expense = 0;
  const codes = new Set(transactions.map((tx) => tx.amount.currency.code));
  if (codes.size > 1) throw new Error("Totals must use one currency.");
  for (const tx of transactions) {
    if (tx.category?.kind === "income") income += toMinor(tx.amount.value);
    else if (tx.category?.kind === "expense") expense += toMinor(tx.amount.value);
  }
  return { income, expense, net: income - expense };
}
