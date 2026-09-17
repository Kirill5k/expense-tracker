"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, Wallet } from "lucide-react";
import { isDateString, periodRange, rangeLabel, shiftRange, type Period } from "@/lib/dates";
import type { Account } from "@/features/accounts/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/fields";
export function useReportFilters(defaultCurrency: string) {
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const rawPeriod = params.get("period") ?? "month";
  const period: Period = ["week", "month", "year", "custom"].includes(rawPeriod)
    ? (rawPeriod as Period)
    : "month";
  const fallback = periodRange(period === "custom" ? "month" : period);
  const from = params.get("from") ?? "",
    to = params.get("to") ?? "";
  const range = isDateString(from) && isDateString(to) && from <= to ? { from, to } : fallback;
  function setFilters(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  return {
    range,
    period,
    defaultCurrency,
    account: params.get("account") ?? "",
    setFilters,
    previousRange: shiftRange(range, period, -1),
    label: rangeLabel(range, period),
  };
}
type AccountFilters = Pick<
  ReturnType<typeof useReportFilters>,
  "account" | "defaultCurrency" | "setFilters"
>;

type AccountControlProps = {
  filters: AccountFilters;
  accounts: Account[];
};

export function AccountControls({ filters, accounts }: AccountControlProps) {
  return (
    <label className="relative grid w-full min-w-0 sm:w-auto">
      <Wallet
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Select
        aria-label="Filter by account"
        value={filters.account}
        onChange={(event) => filters.setFilters({ account: event.target.value, currency: "" })}
        className="w-full rounded-full border-0 bg-card pl-11 font-medium sm:w-auto sm:max-w-64"
      >
        {!accounts.length && <option value="unassigned">No Account</option>}
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} · {account.currency.code}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function NoAccountHint({
  filters,
}: {
  filters: Pick<AccountFilters, "account" | "defaultCurrency">;
}) {
  if (filters.account !== "unassigned") return null;
  return (
    <p className="w-full pt-1 text-xs text-muted-foreground">
      Entries without an account · Using your default currency ({filters.defaultCurrency}).
    </p>
  );
}

export function ReportControls({
  filters,
  accounts,
}: {
  filters: ReturnType<typeof useReportFilters>;
  accounts: Account[];
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center gap-2">
      <AccountControls filters={filters} accounts={accounts} />
      <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
        <div className="flex min-h-12 min-w-0 items-center gap-1 rounded-full bg-card px-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous period"
            onClick={() => filters.setFilters(shiftRange(filters.range, filters.period, -1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-0 truncate px-1 text-sm font-medium" title={filters.label}>
            {filters.label}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next period"
            onClick={() => filters.setFilters(shiftRange(filters.range, filters.period, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <label className="relative shrink-0">
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-muted-foreground sm:block"
          />
          <Select
            aria-label="Reporting period"
            value={filters.period}
            className="w-auto rounded-full border-0 bg-card pl-4 sm:pl-11"
            onChange={(e) => {
              const period = e.target.value as Period;
              filters.setFilters({
                period,
                ...(period === "custom" ? filters.range : periodRange(period)),
              });
            }}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="custom">Custom</option>
          </Select>
        </label>
      </div>
      <NoAccountHint filters={filters} />
      {filters.period === "custom" && (
        <div className="flex w-full flex-wrap items-center gap-2 pt-2">
          <Input
            className="w-auto bg-card"
            type="date"
            aria-label="Start date"
            value={filters.range.from}
            max={filters.range.to}
            onChange={(e) => {
              if (isDateString(e.target.value)) filters.setFilters({ from: e.target.value });
            }}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            className="w-auto bg-card"
            type="date"
            aria-label="End date"
            value={filters.range.to}
            min={filters.range.from}
            onChange={(e) => {
              if (isDateString(e.target.value)) filters.setFilters({ to: e.target.value });
            }}
          />
        </div>
      )}
    </div>
  );
}
