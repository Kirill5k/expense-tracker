"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Recurring } from "./types";
import { useUser } from "@/features/auth/api";
export const useRecurring = () => {
  const user = useUser();
  return useQuery({
    queryKey: ["recurring", user.data?.id],
    queryFn: ({ signal }) => api<Recurring[]>("periodic-transactions", { signal }),
    enabled: Boolean(user.data),
  });
};
