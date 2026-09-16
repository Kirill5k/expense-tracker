import type { Money } from "@/lib/money";
import type { Category } from "@/features/categories/types";
export type Recurrence = {
  startDate: string;
  nextDate: string | null;
  endDate: string | null;
  interval: number;
  frequency: "daily" | "weekly" | "monthly";
};
export type Recurring = {
  id: string;
  categoryId: string;
  accountId: string | null;
  amount: Money;
  recurrence: Recurrence;
  note: string | null;
  tags: string[];
  category?: Category | null;
};
