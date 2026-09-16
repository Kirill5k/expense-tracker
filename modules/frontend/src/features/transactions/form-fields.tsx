"use client";
import Link from "next/link";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import type { Category } from "@/features/categories/types";
import type { Account } from "@/features/accounts/types";
import { Field, Input } from "@/components/ui/fields";
import { AmountInput } from "@/components/ui/amount-input";
import { TagsInput } from "@/components/ui/tags-input";
import { CategorySelect } from "@/features/categories/select";
import type { Currency } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransactionValues } from "./validation";
import { AccountField } from "./account-field";
import { entryCurrency } from "./account-currency";
export function TransactionFields({
  form,
  categories,
  accounts,
  defaultCurrency,
  originalCurrency,
  editing = false,
}: {
  form: UseFormReturn<TransactionValues>;
  categories: Category[];
  accounts: Account[];
  defaultCurrency: string;
  originalCurrency?: Currency;
  editing?: boolean;
}) {
  const kind = useWatch({ control: form.control, name: "kind" }),
    accountId = useWatch({ control: form.control, name: "accountId" });
  const currency = entryCurrency({ accountId }, accounts, defaultCurrency, originalCurrency);
  const availableCategories = categories.filter((category) => category.kind === kind);
  const { errors } = form.formState;
  return (
    <>
      <AccountField
        accounts={accounts}
        accountId={accountId}
        defaultCurrency={defaultCurrency}
        editing={editing}
        accountField={form.register("accountId")}
        accountError={errors.accountId?.message}
      />
      <div
        className="mb-1 flex rounded-full bg-background p-1"
        role="group"
        aria-label="Transaction type"
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
          {...form.register("amount")}
          aria-invalid={Boolean(errors.amount)}
        />
      </Field>
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <Field label="Category" error={errors.categoryId?.message}>
            <CategorySelect
              {...field}
              categories={availableCategories}
              disabled={form.formState.isSubmitting}
              aria-invalid={Boolean(errors.categoryId)}
            />
          </Field>
        )}
      />
      {!categories.some((c) => c.kind === kind) && (
        <p className="text-sm text-muted-foreground">
          You’ll need a category first.{" "}
          <Link href="/categories/new" className="font-medium text-primary underline">
            Create a category
          </Link>
        </p>
      )}
      <Field label="Date" error={errors.date?.message}>
        <Input type="date" {...form.register("date")} aria-invalid={Boolean(errors.date)} />
      </Field>
      <Field label="Note" error={errors.note?.message} hint="Optional · up to 30 characters">
        <Input
          placeholder="What was it for?"
          maxLength={30}
          {...form.register("note")}
          aria-invalid={Boolean(errors.note)}
        />
      </Field>
      <Controller
        control={form.control}
        name="tags"
        render={({ field }) => (
          <Field
            label="Tags"
            error={errors.tags?.message}
            hint="Optional · up to 4 tags. Press comma or Enter to add."
          >
            <TagsInput
              {...field}
              placeholder="Add a tag"
              disabled={form.formState.isSubmitting}
              aria-invalid={Boolean(errors.tags)}
            />
          </Field>
        )}
      />
    </>
  );
}
