"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/fields";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/ui/states";
import { useUser } from "@/features/auth/api";
import { useCategories } from "@/features/categories/api";
import { useTransactions } from "@/features/transactions/api";
import { filterTransactions } from "@/features/transactions/selectors";
import { api, errorMessage, json } from "@/lib/api";
import { periodRange, rangeLabel, shiftRange } from "@/lib/dates";
import { currencies, currencyFor, formatMoney } from "@/lib/money";
import { useAccounts } from "./api";
import { accountActivity, type CurrencyActivity } from "./activity";
import type { Account } from "./types";

const schema = z.object({
  name: z.string().trim().min(1, "Enter an account name.").max(80, "Use 80 characters or fewer."),
  currency: z.string().min(1, "Choose a currency."),
});
type Values = z.infer<typeof schema>;

export function AccountsScreen() {
  const user = useUser();
  const accounts = useAccounts();
  const categories = useCategories();
  const [range, setRange] = useState(() => periodRange("month"));
  const transactions = useTransactions(range);
  if (user.isPending || accounts.isPending || categories.isPending || transactions.isPending)
    return <LoadingState />;
  const error = user.error ?? accounts.error ?? categories.error ?? transactions.error;
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void accounts.refetch();
          void categories.refetch();
          void transactions.refetch();
          void user.refetch();
        }}
      />
    );
  if (!user.data || !accounts.data || !categories.data || !transactions.data) return null;
  const futureDays = user.data.settings.futureTransactionVisibilityDays ?? null;
  const visible = filterTransactions(transactions.data, categories.data, accounts.data, {
    futureDays,
  });
  const unassigned = accountActivity(null, visible, categories.data);
  return (
    <>
      <PageHeading
        eyebrow="Your money"
        title="Accounts"
        description="See the activity in each account, at a glance."
        action={
          <Button asChild>
            <Link href="/accounts/new">
              <Plus />
              New account
            </Link>
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-card p-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setRange(shiftRange(range, "month", -1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium" aria-live="polite">
            {rangeLabel(range, "month")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setRange(shiftRange(range, "month", 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Net activity = income − expenses</p>
      </div>
      {!accounts.data.length && (
        <div className="panel mb-5">
          <EmptyState
            title="Your accounts start here"
            description="Add an account to organise new transactions. Existing transactions without an account stay available."
            action={
              <Button asChild>
                <Link href="/accounts/new">Create account</Link>
              </Button>
            }
          />
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {accounts.data.map((account) => (
          <div key={account.id} className="panel">
            <div className="mb-7 flex items-start gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{account.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {account.currency.code}
                  {account.isMain ? " · Main account" : ""}
                </p>
              </div>
              <Button asChild variant="ghost" size="small">
                <Link href={`/accounts/${account.id}`}>
                  Manage
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
            <ActivityRows
              activity={accountActivity(
                account.id,
                visible,
                categories.data,
                account.currency.code,
              )}
            />
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
              href={`/transactions?account=${account.id}&currency=${account.currency.code}&from=${range.from}&to=${range.to}&period=month`}
            >
              View transactions
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        ))}
        {unassigned.length > 0 && (
          <div className="panel border border-dashed">
            <div className="mb-7">
              <h2 className="font-semibold">No account</h2>
              <p className="mt-1 text-xs text-muted-foreground">Transactions without an account</p>
            </div>
            <ActivityRows activity={unassigned} />
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
              href={`/transactions?account=unassigned&currency=${unassigned[0].currency}&from=${range.from}&to=${range.to}&period=month`}
            >
              View transactions
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Activity reflects the selected month and your future-transaction preference. Each currency
        is shown separately. These figures do not include an opening balance.
      </p>
    </>
  );
}

function ActivityRows({ activity }: { activity: CurrencyActivity[] }) {
  return (
    <div className="grid gap-6">
      {activity.map((value) => (
        <div key={value.currency}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {value.currency} net activity
          </p>
          <p className="text-3xl font-semibold tracking-tight">
            {formatMoney(value.net, value.currency)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1 text-sm font-semibold text-income">
                {formatMoney(value.income, value.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="mt-1 text-sm font-semibold">
                {formatMoney(value.expenses, value.currency)}
              </p>
            </div>
          </div>
          {value.unclassified > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {value.unclassified} transaction(s) with unavailable categories are excluded from
              totals.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function AccountEditorScreen({ id }: { id?: string }) {
  const accounts = useAccounts();
  const user = useUser();
  if (accounts.isPending || user.isPending) return <LoadingState />;
  const error = accounts.error ?? user.error;
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void accounts.refetch();
          void user.refetch();
        }}
      />
    );
  if (!accounts.data || !user.data) return null;
  const account = accounts.data.find((item) => item.id === id);
  if (id && !account)
    return (
      <div className="panel">
        <EmptyState
          title="Account unavailable"
          description="This account may have been archived or removed."
          action={
            <Button asChild>
              <Link href="/accounts">Back to accounts</Link>
            </Button>
          }
        />
      </div>
    );
  return (
    <AccountForm
      key={id ?? "new"}
      account={account}
      accounts={accounts.data}
      defaultCurrency={user.data.settings.currency.code}
    />
  );
}

function AccountForm({
  account,
  accounts,
  defaultCurrency,
}: {
  account?: Account;
  accounts: Account[];
  defaultCurrency: string;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? "",
      currency: account?.currency.code ?? defaultCurrency,
    },
  });
  const initialCurrency = account?.currency.code ?? defaultCurrency;
  const options = currencies.some((currency) => currency.code === initialCurrency)
    ? currencies
    : [account?.currency ?? currencyFor(initialCurrency), ...currencies];
  async function save(values: Values) {
    setError("");
    if (
      accounts.some(
        (item) => item.id !== account?.id && item.name.toLowerCase() === values.name.toLowerCase(),
      )
    ) {
      setError("An account with this name already exists.");
      return;
    }
    try {
      await api(
        account ? `accounts/${account.id}` : "accounts",
        json(account ? "PUT" : "POST", {
          name: values.name,
          currency: account?.currency ?? currencyFor(values.currency),
          isMain: account?.isMain ?? false,
          ...(account ? { id: account.id } : {}),
        }),
      );
      await client.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(account ? "Account updated" : "Account created");
      router.push("/accounts");
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }
  async function archive() {
    if (!account) return;
    await api(`accounts/${account.id}/hidden`, json("PUT", { hidden: true }));
    client.setQueriesData<Account[]>({ queryKey: ["accounts"] }, (items) =>
      items?.filter((item) => item.id !== account.id),
    );
    await Promise.all(
      ["accounts", "transactions", "transaction", "recurring", "user"].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
    toast.success("Account archived");
    router.push("/accounts");
  }
  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" className="mb-5 -ml-4">
        <Link href="/accounts">
          <ArrowLeft />
          Accounts
        </Link>
      </Button>
      <PageHeading
        title={account ? account.name : "New account"}
        description={account?.isMain ? "Your main account" : "Keep your money organised."}
        action={
          account && (
            <Button asChild variant="outline">
              <Link href={`/transactions?account=${account.id}&currency=${account.currency.code}`}>
                View transactions
                <ArrowUpRight />
              </Link>
            </Button>
          )
        }
      />
      <form className="panel grid gap-6" onSubmit={handleSubmit(save)}>
        <Field label="Account name" error={errors.name?.message}>
          <Input
            {...register("name")}
            placeholder="e.g. Everyday account"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>
        <Field
          label="Currency"
          error={errors.currency?.message}
          hint={
            account
              ? "Account currency is fixed after creation."
              : "Used for new transactions in this account. It cannot be changed after creation."
          }
        >
          {account ? (
            <Input value={`${account.currency.code} — ${account.currency.symbol}`} readOnly />
          ) : (
            <Select {...register("currency")}>
              {options.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.symbol}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t pt-5">
          <Button asChild variant="secondary">
            <Link href="/accounts">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save account"}
          </Button>
        </div>
      </form>
      {account && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6">
          <div>
            <p className="text-sm font-medium">Archive account</p>
            <p className="mt-1 text-xs text-muted-foreground">Remove it from your workspace.</p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={isSubmitting}>
                <Archive />
                Archive
              </Button>
            }
            title={`Archive ${account.name}?`}
            description="This also hides transactions assigned to this account and stops its recurring transactions. They will no longer appear in your lists or totals. Archive cannot be undone from this web app."
            onConfirm={archive}
          />
        </div>
      )}
    </div>
  );
}
