"use client";

import { useSyncExternalStore } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { User } from "@/features/auth/types";
import { api, json } from "@/lib/api";
import { createCleanupCoordinator } from "./cleanup-state";

const coordinator = createCleanupCoordinator(
  {
    getItem: (key) => window.sessionStorage.getItem(key),
    setItem: (key, value) => window.sessionStorage.setItem(key, value),
    removeItem: (key) => window.sessionStorage.removeItem(key),
  },
  () => window.dispatchEvent(new Event("data-cleanup")),
);

function subscribe(callback: () => void) {
  window.addEventListener("data-cleanup", callback);
  return () => {
    window.removeEventListener("data-cleanup", callback);
  };
}
export async function clearCachedFinancialData(client: QueryClient) {
  const financial = (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== "user";
  await client.cancelQueries({ predicate: financial });
  client.removeQueries({ predicate: financial });
}

export function requestDataCleanup(userId: string, client: QueryClient): Promise<void> {
  return coordinator.run(userId, async () => {
    await clearCachedFinancialData(client);
    await api("auth/user/data", json("DELETE"));
    const currentUser = client.getQueryData<User>(["user"]);
    if (currentUser?.id === userId) {
      await clearCachedFinancialData(client);
      client.setQueryData<User>(["user"], { ...currentUser, totalTransactionCount: 0 });
      void client.invalidateQueries({ queryKey: ["user"] });
    }
  });
}

export function useDataCleanup(userId?: string) {
  const client = useQueryClient();
  const status = useSyncExternalStore(
    subscribe,
    () => (userId ? coordinator.get(userId) : null),
    () => null,
  );
  return {
    pending: Boolean(status),
    isChecking: status?.running ?? false,
    error: status?.error ?? "",
    retry: async () => {
      if (userId) await requestDataCleanup(userId, client).catch(() => undefined);
    },
  };
}
