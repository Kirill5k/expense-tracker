import type { Currency } from "@/lib/money";
export type UserSettings = {
  currency: Currency;
  hideFutureTransactions: boolean;
  darkMode: boolean | null;
  futureTransactionVisibilityDays: number | null;
};
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  settings: UserSettings;
  registrationDate: string;
  totalTransactionCount: number | null;
};
