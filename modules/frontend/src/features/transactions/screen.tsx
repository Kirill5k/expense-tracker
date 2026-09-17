"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useUser } from "@/features/auth/api";
import { useLedger } from "@/lib/ledger";
import { errorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { reportCurrency } from "@/lib/report-currency";
import { useReportFilters, ReportControls } from "@/components/layout/report-controls";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/fields";
import { Dialog } from "@/components/ui/dialog";
import { PageHeading, LoadingState, ErrorState } from "@/components/ui/states";
import { filterTransactions, transactionTotals } from "./selectors";
import { TransactionList } from "./list";
export function TransactionsScreen() {
  const user = useUser();
  const baseFilters = useReportFilters(user.data?.settings.currency.code ?? "GBP");
  const ledger = useLedger(baseFilters.range),
    params = useSearchParams();
  const filters = { ...baseFilters, ...reportCurrency({ ...baseFilters, ...ledger }) };
  const advanced = ["kind", "category", "min", "max"].some((key) => params.get(key));
  if (ledger.isPending) return <LoadingState />;
  if (ledger.error)
    return <ErrorState message={errorMessage(ledger.error)} retry={ledger.refetch} />;
  const transactions = filterTransactions(ledger.transactions, ledger.categories, ledger.accounts, {
    currency: filters.currency,
    account: filters.account,
    kind: params.get("kind") ?? "",
    category: params.get("category") ?? "",
    search: params.get("search") ?? "",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    futureDays: user.data?.settings.futureTransactionVisibilityDays ?? null,
  });
  const totals = transactionTotals(transactions);
  const filterFields = (
    <div className="grid gap-5">
      <Field label="Transaction type">
        <Select
          value={params.get("kind") ?? ""}
          onChange={(e) => filters.setFilters({ kind: e.target.value, category: "" })}
        >
          <option value="">Income & expenses</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </Select>
      </Field>
      <Field label="Category">
        <Select
          value={params.get("category") ?? ""}
          onChange={(e) => filters.setFilters({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {ledger.categories
            .filter((c) => !params.get("kind") || c.kind === params.get("kind"))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minimum amount">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={params.get("min") ?? ""}
            onChange={(e) => filters.setFilters({ min: e.target.value })}
          />
        </Field>
        <Field label="Maximum amount">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={params.get("max") ?? ""}
            onChange={(e) => filters.setFilters({ max: e.target.value })}
          />
        </Field>
      </div>
      <Button
        variant="secondary"
        onClick={() => filters.setFilters({ kind: "", category: "", min: "", max: "", search: "" })}
      >
        Reset filters
      </Button>
    </div>
  );
  return (
    <>
      <PageHeading
        title="Transactions"
        description="The everyday details. All in one place."
        action={
          <Button asChild>
            <Link href="/transactions/new">
              <Plus />
              Add transaction
            </Link>
          </Button>
        }
      />
      <ReportControls filters={filters} accounts={ledger.accounts} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="panel !p-4 sm:!p-6">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-2 break-all text-lg font-semibold tabular-nums text-income sm:text-2xl">
            {formatMoney(totals.income, filters.currency)}
          </p>
        </div>
        <div className="panel !p-4 sm:!p-6">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="mt-2 break-all text-lg font-semibold tabular-nums sm:text-2xl">
            {formatMoney(totals.expense, filters.currency)}
          </p>
        </div>
        <div className="panel !p-4 sm:!p-6">
          <p className="text-xs text-muted-foreground">Net activity</p>
          <p className="mt-2 break-all text-lg font-semibold tabular-nums sm:text-2xl">
            {formatMoney(totals.net, filters.currency)}
          </p>
        </div>
      </div>
      <div className="panel">
        <div className="mb-6 flex items-center gap-3">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search transactions"
              placeholder="Search transactions"
              className="rounded-full border-0 bg-background pl-11"
              value={params.get("search") ?? ""}
              onChange={(e) => filters.setFilters({ search: e.target.value })}
            />
          </label>
          <Dialog
            title="Filter transactions"
            description="Find exactly what you’re looking for."
            sheet
            trigger={
              <Button variant={advanced ? "default" : "secondary"}>
                <SlidersHorizontal />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            }
          >
            {filterFields}
          </Dialog>
          {advanced && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear filters"
              onClick={() => filters.setFilters({ kind: "", category: "", min: "", max: "" })}
            >
              <X />
            </Button>
          )}
        </div>
        <p className="mb-5 text-xs text-muted-foreground">
          {transactions.length} transactions · {filters.currency}
        </p>
        <TransactionList transactions={transactions} accounts={ledger.accounts} />
      </div>
    </>
  );
}
