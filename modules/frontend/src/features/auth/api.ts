"use client";
import { useQuery } from "@tanstack/react-query";
import { api, json } from "@/lib/api";
import type { User } from "./types";
import { announceSessionChange } from "@/lib/session";
export const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: ({ signal }) => api<User>("auth/user", { signal }),
    retry: false,
  });
export const signIn = (email: string, password: string) =>
  api<void>("auth/login", json("POST", { email, password }));
export const signOut = async () => {
  try {
    await api<void>("auth/logout", json("POST"));
  } finally {
    announceSessionChange();
  }
};
