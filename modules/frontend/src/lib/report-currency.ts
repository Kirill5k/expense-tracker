import type { Account } from "@/features/accounts/types";

export function reportCurrency({
  currency,
  defaultCurrency,
  account: requestedAccount,
  accounts,
  transactions,
}: {
  currency: string;
  defaultCurrency: string;
  account: string;
  accounts: Account[];
  transactions: { accountId: string | null; amount: { currency: { code: string } } }[];
}) {
  const account = !accounts.length
    ? "unassigned"
    : requestedAccount === "unassigned" || accounts.some((item) => item.id === requestedAccount)
      ? requestedAccount
      : "";
  if (account === "unassigned") {
    return { account, currency: defaultCurrency, currencyOptions: [defaultCurrency] };
  }
  const selectedAccount = accounts.find((item) => item.id === account);
  const relevantTransactions = transactions.filter((transaction) =>
    selectedAccount
      ? transaction.accountId === selectedAccount.id
      : !transaction.accountId || accounts.some((item) => item.id === transaction.accountId),
  );
  const fallback = selectedAccount?.currency.code ?? defaultCurrency;
  const currencyOptions = [
    ...new Set([
      fallback,
      ...(!account ? accounts.map((item) => item.currency.code) : []),
      ...relevantTransactions.map((transaction) => transaction.amount.currency.code),
    ]),
  ];
  return {
    account,
    currency: currencyOptions.includes(currency) ? currency : fallback,
    currencyOptions,
  };
}
