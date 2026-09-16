"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Account } from "./types";
import { useUser } from "@/features/auth/api";
export const useAccounts = () => {
  const user = useUser();
  return useQuery({
    queryKey: ["accounts", user.data?.id],
    queryFn: ({ signal }) => api<Account[]>("accounts", { signal }),
    enabled: Boolean(user.data),
  });
};
