import type { Account } from "@/features/accounts/types";

export function reportCurrency({
  defaultCurrency,
  account: requestedAccount,
  accounts,
}: {
  defaultCurrency: string;
  account?: string;
  accounts: Account[];
}) {
  const selectedAccount =
    accounts.find((item) => item.id === requestedAccount) ??
    accounts.find((item) => item.isMain) ??
    accounts[0];
  return {
    account: selectedAccount?.id ?? "unassigned",
    currency: selectedAccount?.currency.code ?? defaultCurrency,
  };
}
