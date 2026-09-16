"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { rangeQuery, type DateRange } from "@/lib/dates";
import type { Transaction } from "./types";
import { useUser } from "@/features/auth/api";
export const useTransactions = (range?: DateRange) => {
  const user = useUser();
  return useQuery({
    queryKey: ["transactions", user.data?.id, range ?? "all"],
    queryFn: ({ signal }) => api<Transaction[]>(`transactions${rangeQuery(range)}`, { signal }),
    enabled: Boolean(user.data),
  });
};
export const useTransaction = (id?: string) => {
  const user = useUser();
  return useQuery({
    queryKey: ["transaction", user.data?.id, id],
    queryFn: ({ signal }) => api<Transaction>(`transactions/${id}`, { signal }),
    enabled: Boolean(id && user.data),
  });
};
