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
  const rawCurrency = params.get("currency") ?? defaultCurrency;
  const currency = /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : defaultCurrency;
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
    currency,
    defaultCurrency,
    account: params.get("account") ?? "",
    setFilters,
    previousRange: shiftRange(range, period, -1),
    label: rangeLabel(range, period),
  };
}
type AccountCurrencyFilters = Pick<
  ReturnType<typeof useReportFilters>,
  "account" | "currency" | "defaultCurrency" | "setFilters"
> & { currencyOptions: string[] };

type AccountCurrencyProps = {
  filters: AccountCurrencyFilters;
  accounts: Account[];
  hasUnassigned?: boolean;
};

export function AccountCurrencyControls({
  filters,
  accounts,
  hasUnassigned = false,
}: AccountCurrencyProps) {
  return (
    <>
      <label className="relative min-w-0">
        <Wallet
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Select
          aria-label="Filter by account"
          value={filters.account}
          onChange={(e) => {
            const account = accounts.find((item) => item.id === e.target.value);
            filters.setFilters({
              account: e.target.value,
              currency:
                e.target.value === "unassigned"
                  ? filters.defaultCurrency
                  : (account?.currency.code ?? filters.currency),
            });
          }}
          className="w-auto max-w-64 rounded-full border-0 bg-card pl-11 font-medium"
        >
          {accounts.length > 0 && <option value="">All accounts</option>}
          {(!accounts.length || hasUnassigned || filters.account === "unassigned") && (
            <option value="unassigned">No account</option>
          )}
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.currency.code}
            </option>
          ))}
        </Select>
      </label>
      {(filters.account === "" || filters.currencyOptions.length > 1) && (
        <Select
          aria-label="Reporting currency"
          value={filters.currency}
          onChange={(e) => filters.setFilters({ currency: e.target.value })}
          className="w-auto rounded-full border-0 bg-card font-medium"
        >
          {filters.currencyOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      )}
    </>
  );
}

export function AccountCurrencyHint({ filters, accounts }: AccountCurrencyProps) {
  if (filters.account === "unassigned") {
    return (
      <p className="w-full pt-1 text-xs text-muted-foreground">
        Entries without an account · Using your default currency ({filters.defaultCurrency}).
      </p>
    );
  }
  if (
    accounts.some((account) => account.id === filters.account) &&
    filters.currencyOptions.length > 1
  ) {
    return (
      <p className="w-full pt-1 text-xs text-muted-foreground">
        This account has entries in different currencies. Each currency is shown separately.
      </p>
    );
  }
  return null;
}

export function ReportControls({
  filters,
  accounts,
  hasUnassigned = false,
}: {
  filters: ReturnType<typeof useReportFilters> & { currencyOptions: string[] };
  accounts: Account[];
  hasUnassigned?: boolean;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center gap-2">
      <AccountCurrencyControls
        filters={filters}
        accounts={accounts}
        hasUnassigned={hasUnassigned}
      />
      <div className="flex min-h-11 items-center gap-1 rounded-full bg-card px-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous period"
          onClick={() => filters.setFilters(shiftRange(filters.range, filters.period, -1))}
        >
          <ChevronLeft />
        </Button>
        <span className="px-1 text-sm font-medium">{filters.label}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next period"
          onClick={() => filters.setFilters(shiftRange(filters.range, filters.period, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
      <label className="relative">
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Select
          aria-label="Reporting period"
          value={filters.period}
          className="w-auto rounded-full border-0 bg-card pl-11"
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
      <AccountCurrencyHint filters={filters} accounts={accounts} />
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
