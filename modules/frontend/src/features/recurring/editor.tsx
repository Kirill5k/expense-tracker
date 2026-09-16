"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { AmountInput } from "@/components/ui/amount-input";
import { TagsInput } from "@/components/ui/tags-input";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/ui/states";
import { useUser } from "@/features/auth/api";
import { useAccounts } from "@/features/accounts/api";
import type { Account } from "@/features/accounts/types";
import { useCategories } from "@/features/categories/api";
import type { Category } from "@/features/categories/types";
import { CategorySelect } from "@/features/categories/select";
import { api, ApiError, errorMessage, json } from "@/lib/api";
import { today } from "@/lib/dates";
import { entryCurrency, initialAccountId } from "@/features/transactions/account-currency";
import { AccountField } from "@/features/transactions/account-field";
import { cn } from "@/lib/utils";
import { useRecurring } from "./api";
import { StopRecurring } from "./actions";
import type { Recurring } from "./types";
import { makeRecurringSchema, recurringInput, type RecurringValues } from "./validation";

export function RecurringEditor({ id }: { id?: string }) {
  const user = useUser(),
    recurring = useRecurring(),
    categories = useCategories(),
    accounts = useAccounts();
  if (user.isPending || categories.isPending || accounts.isPending || (id && recurring.isPending))
    return <LoadingState />;
  const error = user.error ?? categories.error ?? accounts.error ?? (id ? recurring.error : null);
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void user.refetch();
          void categories.refetch();
          void accounts.refetch();
          if (id) void recurring.refetch();
        }}
      />
    );
  const transaction = recurring.data?.find((item) => item.id === id);
  if (id && !transaction)
    return (
      <div className="panel">
        <EmptyState
          title="Schedule unavailable"
          description="This recurring transaction may have been stopped or removed."
          action={
            <Button asChild>
              <Link href="/recurring">Back to recurring</Link>
            </Button>
          }
        />
      </div>
    );
  return (
    <RecurringForm
      key={id ?? "new"}
      transaction={transaction}
      categories={categories.data ?? []}
      accounts={accounts.data ?? []}
      defaultCurrency={user.data?.settings.currency.code ?? "GBP"}
    />
  );
}

function RecurringForm({
  transaction,
  categories,
  accounts,
  defaultCurrency,
}: {
  transaction?: Recurring;
  categories: Category[];
  accounts: Account[];
  defaultCurrency: string;
}) {
  const router = useRouter(),
    client = useQueryClient();
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const editing = Boolean(transaction);
  const form = useForm<RecurringValues>({
    resolver: zodResolver(makeRecurringSchema(transaction)),
    defaultValues: {
      kind: transaction
        ? (categories.find((category) => category.id === transaction.categoryId)?.kind ??
          transaction.category?.kind ??
          "expense")
        : "expense",
      amount: transaction ? transaction.amount.value.toFixed(2) : "",
      accountId: initialAccountId(accounts, defaultCurrency, transaction),
      categoryId: transaction?.categoryId ?? "",
      note: transaction?.note ?? "",
      tags: transaction?.tags.join(", ") ?? "",
      startDate: transaction?.recurrence.startDate ?? today(),
      endDate: transaction?.recurrence.endDate ?? "",
      interval: String(transaction?.recurrence.interval ?? 1),
      frequency: transaction?.recurrence.frequency ?? "monthly",
    },
  });
  const { errors, isSubmitting } = form.formState;
  const [kind, frequency, accountId] = useWatch({
    control: form.control,
    name: ["kind", "frequency", "accountId"],
  });
  const currency = entryCurrency(
    { accountId },
    accounts,
    defaultCurrency,
    transaction?.amount.currency,
  );
  const availableCategories = categories.filter((category) => category.kind === kind);
  async function submit(values: RecurringValues) {
    if (uncertain) return;
    setError("");
    if (!availableCategories.some((category) => category.id === values.categoryId)) {
      form.setError("categoryId", { message: "Choose an available category." });
      return;
    }
    if (values.accountId && !accounts.some((account) => account.id === values.accountId)) {
      form.setError("accountId", { message: "Choose an available account or No account." });
      return;
    }
    try {
      const input = recurringInput(values, accounts, defaultCurrency, transaction);
      await api(
        transaction ? `periodic-transactions/${transaction.id}` : "periodic-transactions",
        json(transaction ? "PUT" : "POST", {
          ...input,
          ...(transaction ? { id: transaction.id, hidden: false } : {}),
        }),
      );
      await client.invalidateQueries();
      toast.success(
        transaction ? "Recurring transaction updated" : "Recurring transaction created",
      );
      router.push("/recurring");
    } catch (failure) {
      setError(errorMessage(failure));
      setUncertain(
        !transaction &&
          (!(failure instanceof ApiError) || failure.status === 0 || failure.status >= 500),
      );
    }
  }
  return (
    <div className="mx-auto max-w-xl">
      <Button asChild variant="ghost" className="mb-5 -ml-4">
        <Link href="/recurring">
          <ArrowLeft />
          Recurring
        </Link>
      </Button>
      <PageHeading
        title={editing ? "Edit recurring" : "Make it recurring"}
        description="Set the rhythm. We’ll keep track of the rest."
      />
      <form className="panel grid gap-5 sm:!p-8" onSubmit={form.handleSubmit(submit)} noValidate>
        <fieldset disabled={isSubmitting} className="contents">
          <AccountField
            accounts={accounts}
            accountId={accountId}
            defaultCurrency={defaultCurrency}
            editing={editing}
            accountField={form.register("accountId")}
            accountError={errors.accountId?.message}
          />
          <div
            className="flex rounded-full bg-background p-1"
            role="group"
            aria-label="Recurring transaction type"
          >
            {(["expense", "income"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                className={cn(
                  "flex-1 capitalize",
                  kind === value && "bg-card text-foreground shadow-sm",
                )}
                aria-pressed={kind === value}
                onClick={() => {
                  form.setValue("kind", value);
                  form.setValue("categoryId", "");
                }}
              >
                {value}
              </Button>
            ))}
          </div>
          <Field label="Amount" error={errors.amount?.message}>
            <AmountInput
              currency={currency}
              placeholder="0.00"
              inputMode="decimal"
              {...form.register("amount")}
              aria-invalid={Boolean(errors.amount)}
            />
          </Field>
          <Controller
            name="categoryId"
            control={form.control}
            render={({ field }) => (
              <Field label="Category" error={errors.categoryId?.message}>
                <CategorySelect
                  {...field}
                  categories={availableCategories}
                  aria-invalid={Boolean(errors.categoryId)}
                  disabled={isSubmitting}
                />
              </Field>
            )}
          />
          {!availableCategories.length && (
            <p className="text-sm text-muted-foreground">
              You’ll need a category first.{" "}
              <Link href="/categories/new" className="font-medium text-primary underline">
                Create a category
              </Link>
            </p>
          )}
          <div className="mt-1 border-t pt-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Repeat2 className="size-4" />
              Schedule
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Repeat every" error={errors.interval?.message}>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  {...form.register("interval")}
                  aria-invalid={Boolean(errors.interval)}
                />
              </Field>
              <Field label="Frequency" error={errors.frequency?.message}>
                <Select {...form.register("frequency")}>
                  <option value="daily">Day(s)</option>
                  <option value="weekly">Week(s)</option>
                  <option value="monthly">Month(s)</option>
                </Select>
              </Field>
              <Field label="Start date" error={errors.startDate?.message}>
                <Input
                  type="date"
                  {...form.register("startDate")}
                  aria-invalid={Boolean(errors.startDate)}
                />
              </Field>
              <Field
                label="End date"
                error={errors.endDate?.message}
                hint="Optional · no transaction is generated on this date."
              >
                <Input
                  type="date"
                  {...form.register("endDate")}
                  aria-invalid={Boolean(errors.endDate)}
                />
              </Field>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Transactions are created when due.
              {!editing && " A past start date also creates past occurrences."}
              {frequency === "monthly" && " Short months use their last available day."}
            </p>
          </div>
          <Field label="Note" error={errors.note?.message} hint="Optional · up to 30 characters">
            <Input
              placeholder="e.g. Monthly rent"
              maxLength={30}
              {...form.register("note")}
              aria-invalid={Boolean(errors.note)}
            />
          </Field>
          <Controller
            name="tags"
            control={form.control}
            render={({ field }) => (
              <Field
                label="Tags"
                error={errors.tags?.message}
                hint="Optional · up to 4 tags. Press comma or Enter to add."
              >
                <TagsInput
                  {...field}
                  placeholder="Add a tag"
                  aria-invalid={Boolean(errors.tags)}
                  disabled={isSubmitting}
                />
              </Field>
            )}
          />
          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {uncertain && (
            <div className="grid gap-3 rounded-xl bg-secondary p-4 text-sm">
              <p>
                Check your recurring list before retrying. The last request may have reached the
                server.
              </p>
              <Link
                href="/recurring"
                target="_blank"
                className="font-medium text-primary underline"
              >
                Review recurring transactions in a new tab
              </Link>
              <Button type="button" variant="outline" onClick={() => setUncertain(false)}>
                I checked — enable retry
              </Button>
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <Button asChild variant="secondary">
              <Link href="/recurring">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || uncertain}>
              <Check />
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create recurring"}
            </Button>
          </div>
        </fieldset>
      </form>
      {transaction && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6">
          <div>
            <p className="text-sm font-medium">Stop this recurring transaction</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep existing transactions in your history.
            </p>
          </div>
          <StopRecurring
            transaction={transaction}
            disabled={isSubmitting}
            onStopped={() => router.push("/recurring")}
          />
        </div>
      )}
    </div>
  );
}
