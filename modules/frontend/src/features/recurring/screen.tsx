"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarClock, Plus, Repeat2 } from "lucide-react";
import {
  AccountControls,
  NoAccountHint,
  useReportFilters,
} from "@/components/layout/report-controls";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/fields";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/ui/states";
import { useAccounts } from "@/features/accounts/api";
import { useUser } from "@/features/auth/api";
import { useCategories } from "@/features/categories/api";
import { CategoryIcon } from "@/features/categories/icon";
import { errorMessage } from "@/lib/api";
import { formatMoney, toMinor } from "@/lib/money";
import { reportCurrency } from "@/lib/report-currency";
import { cn } from "@/lib/utils";
import { useRecurring } from "./api";
import { RecurringActions } from "./actions";
import { nextOccurrence, recurrenceLabel } from "./validation";

export function RecurringScreen() {
  const user = useUser(),
    recurring = useRecurring(),
    accounts = useAccounts(),
    categories = useCategories();
  const baseFilters = useReportFilters(user.data?.settings.currency.code ?? "GBP");
  const params = useSearchParams();
  const kind = params.get("kind") ?? "";
  const filters = {
    ...baseFilters,
    ...reportCurrency({
      ...baseFilters,
      accounts: accounts.data ?? [],
    }),
  };
  if (user.isPending || recurring.isPending || accounts.isPending || categories.isPending)
    return <LoadingState />;
  const error = user.error ?? recurring.error ?? accounts.error ?? categories.error;
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void user.refetch();
          void recurring.refetch();
          void accounts.refetch();
          void categories.refetch();
        }}
      />
    );
  const schedules = (recurring.data ?? [])
    .filter(
      (item) =>
        categories.data?.some((category) => category.id === item.categoryId) &&
        (!item.accountId || accounts.data?.some((account) => account.id === item.accountId)),
    )
    .map((item) => ({
      ...item,
      category: categories.data?.find((category) => category.id === item.categoryId),
    }));
  const selectedSchedules = schedules.filter(
    (item) =>
      item.amount.currency.code === filters.currency &&
      (filters.account === "unassigned" ? !item.accountId : item.accountId === filters.account),
  );
  const activeCount = selectedSchedules.filter(
    (item) => nextOccurrence(item.recurrence).status !== "ended",
  ).length;
  const filtered = selectedSchedules
    .filter((item) => !kind || item.category?.kind === kind)
    .sort((left, right) =>
      (nextOccurrence(left.recurrence).date ?? "9999").localeCompare(
        nextOccurrence(right.recurrence).date ?? "9999",
      ),
    );
  return (
    <>
      <PageHeading
        eyebrow="Plan ahead"
        title="Recurring"
        description="A little less to remember, every month."
        action={
          <Button asChild>
            <Link href="/recurring/new">
              <Plus />
              New recurring
            </Link>
          </Button>
        }
      />
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <AccountControls filters={filters} accounts={accounts.data ?? []} />
        <NoAccountHint filters={filters} />
      </div>
      <div className="panel mb-6 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Active schedules</p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums">{activeCount}</p>
          <p className="mt-3 text-sm text-muted-foreground">Income and expenses that repeat.</p>
        </div>
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Repeat2 className="size-7" aria-hidden="true" />
        </span>
      </div>
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Your schedules</h2>
          <Select
            aria-label="Filter recurring transaction type"
            value={kind}
            onChange={(event) => filters.setFilters({ kind: event.target.value })}
            className="w-auto rounded-full border-0 bg-background"
          >
            <option value="">Income & expenses</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </Select>
        </div>
        {!filtered.length ? (
          <EmptyState
            title={schedules.length ? "No matching schedules" : "Make it a regular thing"}
            description={
              schedules.length
                ? "Try a different account or transaction type to see your other schedules."
                : "Add rent, subscriptions, or payday. Transactions are recorded automatically when they’re due."
            }
            action={
              <Button asChild>
                <Link href="/recurring/new">
                  <Plus />
                  Add recurring transaction
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {filtered.map((transaction) => {
              const next = nextOccurrence(transaction.recurrence);
              const income = transaction.category?.kind === "income";
              const expense = transaction.category?.kind === "expense";
              return (
                <li key={transaction.id} className="py-5 first:pt-1 last:pb-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CategoryIcon category={transaction.category} />
                    <Link
                      href={`/recurring/${transaction.id}`}
                      className="min-w-0 flex-1 rounded-md"
                    >
                      <p className="truncate text-sm font-semibold">
                        {transaction.note || transaction.category?.name || "Recurring transaction"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {transaction.category?.name ?? "Category unavailable"}
                      </p>
                      {transaction.tags.length > 0 && (
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {transaction.tags.map((tag) => `#${tag}`).join(" ")}
                        </p>
                      )}
                    </Link>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums sm:text-base",
                          income && "text-income",
                        )}
                      >
                        {income ? "+" : expense ? "−" : ""}
                        {formatMoney(
                          toMinor(transaction.amount.value),
                          transaction.amount.currency.code,
                        )}
                      </p>
                    </div>
                    <RecurringActions transaction={transaction} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:ml-15">
                    <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2 text-xs text-muted-foreground">
                      <Repeat2 className="size-3.5" aria-hidden="true" />
                      {recurrenceLabel(transaction.recurrence)}
                    </p>
                    <p
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full bg-background px-3 py-2 text-xs",
                        next.status === "ended" ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {next.date
                        ? `${next.status === "due" ? "Due" : "Next"} ${format(parseISO(next.date), "d MMM yyyy")}`
                        : "Schedule ended"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Due transactions appear after the server processes the schedule. An end date excludes that
        day; existing transactions remain in your history.
      </p>
    </>
  );
}
