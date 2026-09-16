import { z } from "zod";
import { isDateString } from "@/lib/dates";
import { toMinor } from "@/lib/money";
export function parseAmount(raw: string): number {
  const value = raw.trim();
  if (/[,;\n\r]/.test(value)) throw new Error("Enter one amount, using a dot for decimals.");
  const minor = toMinor(value);
  if (minor <= 0) throw new Error("Amount must be greater than zero.");
  return minor / 100;
}
export const parseTags = (raw: string) => [
  ...new Set(
    raw
      .toLowerCase()
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  ),
];
export const resolvedTags = (raw: string, original?: string[]) =>
  original && raw === original.join(", ") ? original : parseTags(raw);
export const noteSchema = (original?: string | null) =>
  z
    .string()
    .refine(
      (value) => value === original || value.trim().length <= 30,
      "Keep your note to 30 characters.",
    );
export const tagsSchema = (original?: string[]) =>
  z
    .string()
    .refine(
      (value) => (original && value === original.join(", ")) || parseTags(value).length <= 4,
      "Use up to 4 unique tags.",
    );
export const transactionSchema = z.object({
  kind: z.enum(["expense", "income"]),
  amount: z.string().superRefine((value, context) => {
    try {
      parseAmount(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Enter a valid amount.",
      });
    }
  }),
  categoryId: z.string().min(1, "Choose a category."),
  accountId: z.string(),
  date: z.string().refine(isDateString, "Choose a valid date."),
  note: noteSchema(),
  tags: tagsSchema(),
});
export type TransactionValues = z.infer<typeof transactionSchema>;
