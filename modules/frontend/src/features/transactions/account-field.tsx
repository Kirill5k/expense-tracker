"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, Select } from "@/components/ui/fields";
import type { Account } from "@/features/accounts/types";

export function AccountField({
  accounts,
  accountId,
  defaultCurrency,
  editing = false,
  accountField,
  accountError,
}: {
  accounts: Account[];
  accountId: string;
  defaultCurrency: string;
  editing?: boolean;
  accountField: UseFormRegisterReturn<"accountId">;
  accountError?: string;
}) {
  return (
    <Field
      label="Account"
      error={accountError}
      hint={
        editing
          ? "Changing accounts keeps the recorded currency."
          : !accountId
            ? `Uses your default currency (${defaultCurrency}).`
            : undefined
      }
    >
      <Select {...accountField} aria-invalid={Boolean(accountError)}>
        <option value="">No account</option>
        {accountId && !accounts.some((account) => account.id === accountId) && (
          <option value={accountId} disabled>
            Account unavailable — choose another
          </option>
        )}
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} · {account.currency.code}
          </option>
        ))}
      </Select>
    </Field>
  );
}
