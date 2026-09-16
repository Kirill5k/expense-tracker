import type { Account } from "@/features/accounts/types";
import { currencyFor, type Currency } from "@/lib/money";

export function initialAccountId(
  accounts: Account[],
  defaultCurrency: string,
  original?: { accountId: string | null },
): string {
  if (original) return original.accountId ?? "";
  return (
    accounts.find((account) => account.isMain && account.currency.code === defaultCurrency)?.id ??
    ""
  );
}

export function entryCurrency(
  values: { accountId: string },
  accounts: Account[],
  defaultCurrency: string,
  original?: Currency,
): Currency {
  return (
    original ??
    accounts.find((account) => account.id === values.accountId)?.currency ??
    currencyFor(defaultCurrency)
  );
}
