"use client";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Repeat2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useUser } from "@/features/auth/api";
import { useTransactions } from "@/features/transactions/api";
import { filterTransactions, transactionTotals } from "@/features/transactions/selectors";
import { TransactionList } from "@/features/transactions/list";
import { CategoryIcon } from "@/features/categories/icon";
import { useLedger } from "@/lib/ledger";
import { errorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { reportCurrency } from "@/lib/report-currency";
import { cn } from "@/lib/utils";
import {
  PageHeading,
  SectionHeading,
  ErrorState,
  LoadingState,
  EmptyState,
} from "@/components/ui/states";
import { ReportControls, useReportFilters } from "@/components/layout/report-controls";
import { SpendingChart } from "./charts";
import { spendingByCategory, spendingTrend, percentageChange } from "./selectors";
export function OverviewScreen() {
  const user = useUser();
  const baseFilters = useReportFilters(user.data?.settings.currency.code ?? "GBP");
  const ledger = useLedger(baseFilters.range),
    previous = useTransactions(baseFilters.previousRange);
  const filters = { ...baseFilters, ...reportCurrency({ ...baseFilters, ...ledger }) };
  if (ledger.isPending) return <LoadingState />;
  if (ledger.error)
    return <ErrorState message={errorMessage(ledger.error)} retry={ledger.refetch} />;
  const selection = {
    currency: filters.currency,
    account: filters.account,
    futureDays: user.data?.settings.futureTransactionVisibilityDays ?? null,
  };
  const transactions = filterTransactions(
    ledger.transactions,
    ledger.categories,
    ledger.accounts,
    selection,
  );
  const totals = transactionTotals(transactions);
  const previousTotals = transactionTotals(
    filterTransactions(previous.data ?? [], ledger.categories, ledger.accounts, selection),
  );
  const change = previous.isSuccess
    ? percentageChange(totals.expense, previousTotals.expense)
    : null;
  const categoryTotals = spendingByCategory(transactions);
  const query = new URLSearchParams({
    ...filters.range,
    period: filters.period,
    currency: filters.currency,
    ...(filters.account ? { account: filters.account } : {}),
  });
  return (
    <>
      <PageHeading
        eyebrow="Your money at a glance"
        title={`Hello, ${user.data?.firstName ?? "there"}`}
      />
      <ReportControls
        filters={filters}
        accounts={ledger.accounts}
        hasUnassigned={ledger.transactions.some((transaction) => !transaction.accountId)}
      />
      <section className="panel mb-6 !p-6 sm:!p-8" aria-label="Financial summary">
        <div className="grid gap-7 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Net activity <span className="mx-1">·</span> {filters.currency}
            </p>
            <p className="mt-3 break-all text-5xl font-semibold leading-tight tabular-nums sm:text-6xl">
              {formatMoney(totals.net, filters.currency)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Income minus expenses for {filters.label.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-4 md:justify-end md:gap-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-full bg-income/10 text-income">
                  <ArrowDownLeft className="size-4" />
                </span>
                Income
              </div>
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">
                {formatMoney(totals.income, filters.currency)}
              </p>
            </div>
            <div className="mx-2 h-12 w-px bg-border" />
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-foreground">
                  <ArrowUpRight className="size-4" />
                </span>
                Expenses
              </div>
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">
                {formatMoney(totals.expense, filters.currency)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-6 border-t border-border pt-6 sm:gap-8">
          {[
            { label: "Add expense", href: "/transactions/new?kind=expense", icon: Plus },
            { label: "Add income", href: "/transactions/new?kind=income", icon: ArrowDownLeft },
            { label: "Set recurring", href: "/recurring/new", icon: Repeat2 },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-lg text-xs font-medium sm:flex-row sm:gap-3 sm:text-sm"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="size-5" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </section>
      <div className="mb-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="panel min-w-0 !p-6 sm:!p-7">
          <SectionHeading title="Your spending">
            <Link
              href={`/transactions?${query}&kind=expense`}
              aria-label="View expense transactions"
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
            >
              <ArrowUpRight className="size-5" />
            </Link>
          </SectionHeading>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold tabular-nums">
              {formatMoney(totals.expense, filters.currency)}
            </p>
            {change !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  change <= 0 ? "bg-income/10 text-income" : "bg-secondary text-muted-foreground",
                )}
              >
                {change <= 0 ? (
                  <TrendingDown className="size-3" />
                ) : (
                  <TrendingUp className="size-3" />
                )}
                {Math.abs(change)}% {change <= 0 ? "less" : "more"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {previous.isError
              ? "Previous period unavailable"
              : previous.isPending
                ? "Loading comparison…"
                : previousTotals.expense
                  ? `${formatMoney(previousTotals.expense, filters.currency)} spent in the previous period`
                  : "No expenses in the previous period"}
          </p>
          <SpendingChart
            data={spendingTrend(transactions, filters.range)}
            currency={filters.currency}
          />
          <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              Expenses
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-income" />
              Income
            </span>
          </div>
        </section>
        <section className="panel !p-6 sm:!p-7">
          <SectionHeading title="Where it went">
            <span className="text-xs text-muted-foreground">By category</span>
          </SectionHeading>
          {categoryTotals.length ? (
            <div className="grid gap-5">
              {categoryTotals.slice(0, 5).map(({ category, total }) => (
                <Link
                  key={category.id}
                  href={`/transactions?${query}&category=${category.id}`}
                  className="group rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={category} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Math.round((total / totals.expense) * 100)}% of spending
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(total, filters.currency)}
                    </p>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                  <div className="ml-12 mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(total / totals.expense) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
              {categoryTotals.length > 5 && (
                <Link
                  className="text-sm font-medium text-primary"
                  href={`/transactions?${query}&kind=expense`}
                >
                  View all spending categories
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="Nothing spent yet"
              description="Your spending breakdown will take shape as you add expenses."
            />
          )}
        </section>
      </div>
      <section className="panel !p-6 sm:!p-7">
        <SectionHeading title="Recent activity">
          <Link
            href={`/transactions?${query}`}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            View all
            <ChevronRight className="size-4" />
          </Link>
        </SectionHeading>
        <TransactionList
          transactions={transactions}
          accounts={ledger.accounts}
          limit={5}
          actions={false}
        />
      </section>
    </>
  );
}
