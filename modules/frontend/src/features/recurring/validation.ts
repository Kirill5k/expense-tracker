import { z } from "zod";
import { isDateString, today } from "@/lib/dates";
import type { Account } from "@/features/accounts/types";
import { entryCurrency } from "@/features/transactions/account-currency";
import {
  noteSchema,
  parseAmount,
  resolvedTags,
  tagsSchema,
  transactionSchema,
} from "@/features/transactions/validation";
import type { Recurrence, Recurring } from "./types";

export const makeRecurringSchema = (original?: Recurring) =>
  transactionSchema
    .extend({ note: noteSchema(original?.note), tags: tagsSchema(original?.tags) })
    .omit({ date: true })
    .extend({
      startDate: z.string().refine(isDateString, "Choose a valid start date."),
      endDate: z.string().refine((date) => !date || isDateString(date), "Choose a valid end date."),
      interval: z
        .string()
        .refine(
          (value) => /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 2147483647,
          "Enter a whole number greater than zero.",
        ),
      frequency: z.enum(["daily", "weekly", "monthly"]),
    })
    .superRefine((values, context) => {
      if (values.endDate && values.endDate <= values.startDate) {
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "The end date must be after the start date.",
        });
      }
    });

export const recurringSchema = makeRecurringSchema();
export type RecurringValues = z.infer<typeof recurringSchema>;

export function recurringInput(
  values: RecurringValues,
  accounts: Account[],
  defaultCurrency: string,
  original?: Recurring,
) {
  return {
    categoryId: values.categoryId,
    accountId: values.accountId || null,
    amount: {
      value: parseAmount(values.amount),
      currency: entryCurrency(values, accounts, defaultCurrency, original?.amount.currency),
    },
    recurrence: {
      startDate: values.startDate,
      endDate: values.endDate || null,
      nextDate: original?.recurrence.nextDate ?? null,
      interval: Number(values.interval),
      frequency: values.frequency,
    },
    note: values.note === original?.note ? original.note : values.note.trim() || null,
    tags: resolvedTags(values.tags, original?.tags),
  };
}

export function nextOccurrence(
  recurrence: Recurrence,
  currentDay = today(),
): { date: string | null; status: "ended" | "due" | "scheduled" } {
  const date = recurrence.nextDate ?? recurrence.startDate;
  if (recurrence.endDate && date >= recurrence.endDate) return { date: null, status: "ended" };
  return { date, status: date <= currentDay ? "due" : "scheduled" };
}

export function recurrenceLabel(recurrence: Recurrence): string {
  const unit =
    recurrence.frequency === "daily" ? "day" : recurrence.frequency === "weekly" ? "week" : "month";
  return recurrence.interval === 1 ? `Every ${unit}` : `Every ${recurrence.interval} ${unit}s`;
}
