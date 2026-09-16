"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "./types";
import { useUser } from "@/features/auth/api";
export const useCategories = () => {
  const user = useUser();
  return useQuery({
    queryKey: ["categories", user.data?.id],
    queryFn: ({ signal }) => api<Category[]>("categories", { signal }),
    enabled: Boolean(user.data),
  });
};
