import {
  eachDayOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { DateRange } from "@/lib/dates";
import { toMinor } from "@/lib/money";
import type { Transaction } from "@/features/transactions/types";
import type { Category } from "@/features/categories/types";
export function spendingByCategory(
  transactions: Transaction[],
): { category: Category; total: number }[] {
  const grouped = new Map<string, { category: Category; total: number }>();
  for (const tx of transactions) {
    if (tx.category?.kind !== "expense") continue;
    const item = grouped.get(tx.categoryId) ?? { category: tx.category, total: 0 };
    item.total += toMinor(tx.amount.value);
    grouped.set(tx.categoryId, item);
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total);
}
export function spendingTrend(transactions: Transaction[], range: DateRange) {
  const interval = { start: parseISO(range.from), end: parseISO(range.to) };
  const monthly = differenceInCalendarDays(interval.end, interval.start) > 90;
  const days = monthly ? eachMonthOfInterval(interval) : eachDayOfInterval(interval);
  const keyFormat = monthly ? "yyyy-MM" : "yyyy-MM-dd";
  const values = new Map(
    days.map((date) => [
      format(date, keyFormat),
      {
        date: format(date, keyFormat),
        label: format(date, monthly ? "MMM" : "d MMM"),
        expense: 0,
        income: 0,
      },
    ]),
  );
  for (const tx of transactions) {
    const row = values.get(format(parseISO(tx.date), keyFormat));
    if (row && tx.category) row[tx.category.kind] += toMinor(tx.amount.value);
  }
  return [...values.values()];
}
export function percentageChange(current: number, previous: number): number | null {
  return previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
}
