"use client";
import { useAccounts } from "@/features/accounts/api";
import { useCategories } from "@/features/categories/api";
import { useTransactions } from "@/features/transactions/api";
import type { DateRange } from "./dates";
export function useLedger(range?: DateRange) {
  const accounts = useAccounts(),
    categories = useCategories(),
    transactions = useTransactions(range);
  return {
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    transactions: transactions.data ?? [],
    isPending: accounts.isPending || categories.isPending || transactions.isPending,
    error: accounts.error ?? categories.error ?? transactions.error,
    refetch: () => {
      void Promise.all([accounts.refetch(), categories.refetch(), transactions.refetch()]);
    },
  };
}
