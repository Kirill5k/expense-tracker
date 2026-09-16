"use client";
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api";
import { announceSessionChange, SESSION_CHANGE_KEY } from "@/lib/session";
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (count, error) =>
              count < 1 &&
              (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    const clearSession = () => {
      void client.cancelQueries();
      client.clear();
      router.replace("/signin");
    };
    const expired = () => {
      announceSessionChange();
      clearSession();
    };
    const changed = (event: StorageEvent) => {
      if (event.key === SESSION_CHANGE_KEY) clearSession();
    };
    window.addEventListener("session-expired", expired);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("session-expired", expired);
      window.removeEventListener("storage", changed);
    };
  }, [client, router]);
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
