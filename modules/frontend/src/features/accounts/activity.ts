import type { Category } from "@/features/categories/types";
import type { Transaction } from "@/features/transactions/types";
import { toMinor } from "@/lib/money";

export type CurrencyActivity = {
  currency: string;
  income: number;
  expenses: number;
  net: number;
  count: number;
  unclassified: number;
};
export function accountActivity(
  accountId: string | null,
  transactions: Transaction[],
  categories: Category[],
  defaultCurrency?: string,
): CurrencyActivity[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const groups = new Map<string, CurrencyActivity>();
  const group = (currency: string) => {
    if (!groups.has(currency))
      groups.set(currency, { currency, income: 0, expenses: 0, net: 0, count: 0, unclassified: 0 });
    return groups.get(currency)!;
  };
  if (defaultCurrency) group(defaultCurrency);
  for (const transaction of transactions) {
    if (transaction.accountId !== accountId) continue;
    const activity = group(transaction.amount.currency.code);
    const kind = transaction.category?.kind ?? byId.get(transaction.categoryId)?.kind;
    activity.count += 1;
    if (!kind) {
      activity.unclassified += 1;
      continue;
    }
    const amount = toMinor(transaction.amount.value);
    if (kind === "income") activity.income += amount;
    else activity.expenses += amount;
    activity.net = activity.income - activity.expenses;
  }
  return [...groups.values()].sort((a, b) =>
    a.currency === defaultCurrency
      ? -1
      : b.currency === defaultCurrency
        ? 1
        : a.currency.localeCompare(b.currency),
  );
}
