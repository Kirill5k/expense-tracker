import type { Money } from "@/lib/money";
import type { Category } from "@/features/categories/types";
export type Transaction = {
  id: string;
  categoryId: string;
  accountId: string | null;
  parentTransactionId: string | null;
  isRecurring: boolean;
  amount: Money;
  date: string;
  note: string | null;
  tags: string[];
  category?: Category | null;
};
export type TransactionInput = Pick<
  Transaction,
  "categoryId" | "accountId" | "amount" | "date" | "note" | "tags"
>;
