"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/features/auth/api";
import { useAccounts } from "@/features/accounts/api";
import { useCategories } from "@/features/categories/api";
import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import { api, ApiError, json, errorMessage } from "@/lib/api";
import { today } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, PageHeading } from "@/components/ui/states";
import { useTransaction } from "./api";
import { TransactionFields } from "./form-fields";
import { entryCurrency, initialAccountId } from "./account-currency";
import {
  noteSchema,
  parseAmount,
  resolvedTags,
  tagsSchema,
  transactionSchema,
  type TransactionValues,
} from "./validation";
import type { Transaction, TransactionInput } from "./types";

export function TransactionEditor({ id }: { id?: string }) {
  const params = useSearchParams(),
    user = useUser(),
    categories = useCategories(),
    accounts = useAccounts();
  const copyId = !id ? (params.get("copy") ?? undefined) : undefined;
  const transaction = useTransaction(id ?? copyId);
  if (
    user.isPending ||
    categories.isPending ||
    accounts.isPending ||
    ((id || copyId) && transaction.isPending)
  )
    return <LoadingState />;
  const error = user.error ?? categories.error ?? accounts.error ?? transaction.error;
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void user.refetch();
          void categories.refetch();
          void accounts.refetch();
          if (id || copyId) void transaction.refetch();
        }}
      />
    );
  return (
    <TransactionForm
      key={id ?? copyId ?? "new"}
      transaction={transaction.data}
      editing={Boolean(id)}
      categories={categories.data ?? []}
      accounts={accounts.data ?? []}
      defaultCurrency={user.data?.settings.currency.code ?? "GBP"}
      initialKind={params.get("kind") === "income" ? "income" : "expense"}
    />
  );
}
function TransactionForm({
  transaction,
  editing,
  categories,
  accounts,
  defaultCurrency,
  initialKind,
}: {
  transaction?: Transaction;
  editing: boolean;
  categories: Category[];
  accounts: Account[];
  defaultCurrency: string;
  initialKind: "income" | "expense";
}) {
  const router = useRouter(),
    client = useQueryClient();
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const accountId = initialAccountId(accounts, defaultCurrency, transaction);
  const form = useForm<TransactionValues>({
    resolver: zodResolver(
      transactionSchema.extend({
        note: noteSchema(transaction?.note),
        tags: tagsSchema(transaction?.tags),
      }),
    ),
    defaultValues: {
      kind: transaction
        ? (categories.find((c) => c.id === transaction.categoryId)?.kind ?? initialKind)
        : initialKind,
      amount: transaction ? transaction.amount.value.toFixed(2) : "",
      accountId,
      categoryId: transaction?.categoryId ?? "",
      date: editing && transaction ? transaction.date : today(),
      note: transaction?.note ?? "",
      tags: transaction?.tags.join(", ") ?? "",
    },
  });
  async function submit(values: TransactionValues) {
    if (uncertain) return;
    setError("");
    if (
      !categories.some(
        (category) => category.id === values.categoryId && category.kind === values.kind,
      )
    ) {
      form.setError("categoryId", { message: "Choose an available category." });
      return;
    }
    if (values.accountId && !accounts.some((account) => account.id === values.accountId)) {
      form.setError("accountId", { message: "Choose an available account or No account." });
      return;
    }
    const currency = entryCurrency(
      values,
      accounts,
      defaultCurrency,
      editing ? transaction?.amount.currency : undefined,
    );
    const input: TransactionInput = {
      amount: { value: parseAmount(values.amount), currency },
      accountId: values.accountId || null,
      categoryId: values.categoryId,
      date: values.date,
      note: values.note === transaction?.note ? transaction.note : values.note.trim() || null,
      tags: resolvedTags(values.tags, transaction?.tags),
    };
    try {
      if (editing && transaction) {
        await api(
          `transactions/${transaction.id}`,
          json("PUT", {
            ...input,
            id: transaction.id,
            parentTransactionId: transaction.parentTransactionId,
            isRecurring: transaction.isRecurring,
            hidden: false,
          }),
        );
      } else {
        await api("transactions", json("POST", input));
      }
      await client.invalidateQueries();
      toast.success(editing ? "Transaction updated" : "Transaction added");
      router.push(
        values.accountId
          ? `/transactions?account=${encodeURIComponent(values.accountId)}`
          : "/transactions",
      );
    } catch (error) {
      setError(errorMessage(error));
      setUncertain(
        !editing && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
      );
    }
  }
  return (
    <div className="mx-auto max-w-xl">
      <Button asChild variant="ghost" className="mb-5 -ml-4">
        <Link href="/transactions">
          <ArrowLeft />
          Transactions
        </Link>
      </Button>
      <PageHeading
        title={editing ? "Edit transaction" : transaction ? "Make a copy" : "Add transaction"}
        description="It’s the little things that make the big picture."
      />
      <form className="panel grid gap-5 sm:!p-8" onSubmit={form.handleSubmit(submit)} noValidate>
        <fieldset disabled={form.formState.isSubmitting} className="contents">
          <TransactionFields
            form={form}
            categories={categories}
            accounts={accounts}
            defaultCurrency={defaultCurrency}
            originalCurrency={editing ? transaction?.amount.currency : undefined}
            editing={editing}
          />
          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {uncertain && (
            <div className="grid gap-3 rounded-xl bg-secondary p-4 text-sm">
              <p>
                Check your transaction list before retrying: the last request may have reached the
                server.
              </p>
              <Link
                href="/transactions"
                target="_blank"
                className="font-medium text-primary underline"
              >
                Review transactions in a new tab
              </Link>
              <Button type="button" variant="outline" onClick={() => setUncertain(false)}>
                I checked — enable retry
              </Button>
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <Button asChild variant="secondary">
              <Link href="/transactions">Cancel</Link>
            </Button>
            <Button type="submit" disabled={uncertain || form.formState.isSubmitting}>
              <Check />
              {form.formState.isSubmitting
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Add transaction"}
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
