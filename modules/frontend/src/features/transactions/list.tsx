"use client";
import Link from "next/link";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Archive, Copy, Ellipsis, Pencil, Plus, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { api, json, errorMessage } from "@/lib/api";
import { formatMoney, toMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/features/categories/icon";
import type { Account } from "@/features/accounts/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import type { Transaction } from "./types";

function TransactionActions({ transaction }: { transaction: Transaction }) {
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  async function archive() {
    setPending(true);
    try {
      await api<void>(`transactions/${transaction.id}/hidden`, json("PUT", { hidden: true }));
      await client.invalidateQueries();
      toast.success("Transaction archived", {
        duration: 10000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await api(`transactions/${transaction.id}/hidden`, json("PUT", { hidden: false }));
              await client.invalidateQueries();
            } catch (error) {
              toast.error(errorMessage(error));
            }
          },
        },
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${transaction.note || transaction.category?.name || "transaction"}`}
          disabled={pending}
        >
          <Ellipsis />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={5}
          className="z-50 min-w-40 rounded-2xl border border-border bg-card p-2 shadow-lg"
        >
          <Dropdown.Item asChild>
            <Link
              href={`/transactions/${transaction.id}`}
              className="flex items-center gap-3 rounded-xl p-3 text-sm outline-none focus:bg-secondary"
            >
              <Pencil className="size-4" />
              Edit
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link
              href={`/transactions/new?copy=${transaction.id}`}
              className="flex items-center gap-3 rounded-xl p-3 text-sm outline-none focus:bg-secondary"
            >
              <Copy className="size-4" />
              Make a copy
            </Link>
          </Dropdown.Item>
          <Dropdown.Item
            onSelect={() => {
              void archive();
            }}
            className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm text-destructive outline-none focus:bg-secondary"
          >
            <Archive className="size-4" />
            Archive
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function TransactionList({
  transactions,
  accounts,
  limit,
  actions = true,
}: {
  transactions: Transaction[];
  accounts: Account[];
  limit?: number;
  actions?: boolean;
}) {
  if (!transactions.length)
    return (
      <EmptyState
        title="A fresh start"
        description="Your transactions will appear here. Add your first one, or try a different period or filter."
        action={
          <Button asChild>
            <Link href="/transactions/new">
              <Plus />
              Add transaction
            </Link>
          </Button>
        }
      />
    );
  const rows = limit ? transactions.slice(0, limit) : transactions;
  const grouped = rows.reduce<Record<string, Transaction[]>>((groups, tx) => {
    (groups[tx.date] ??= []).push(tx);
    return groups;
  }, {});
  return (
    <div>
      {Object.entries(grouped).map(([date, txs]) => (
        <section
          key={date}
          className="mb-5 last:mb-0"
          aria-label={format(parseISO(date), "d MMMM yyyy")}
        >
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            {format(parseISO(date), "EEEE, d MMMM")}
          </h3>
          <ul>
            {txs?.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-3 border-b border-border/70 py-3 last:border-0 sm:gap-4"
              >
                <CategoryIcon category={tx.category} />
                <Link href={`/transactions/${tx.id}`} className="min-w-0 flex-1 rounded-md">
                  <p className="truncate text-sm font-semibold">
                    {tx.note || tx.category?.name || "Transaction"}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {tx.isRecurring && <Repeat2 className="size-3 shrink-0" />}
                    {tx.note
                      ? tx.category?.name
                      : (accounts.find((a) => a.id === tx.accountId)?.name ?? "No account")}
                    {tx.tags.length > 0 && (
                      <span className="hidden sm:inline">
                        {" "}
                        · {tx.tags.map((tag) => `#${tag}`).join(" ")}
                      </span>
                    )}
                  </p>
                </Link>
                <span className="hidden w-28 truncate text-xs text-muted-foreground xl:block">
                  {accounts.find((a) => a.id === tx.accountId)?.name ?? "No account"}
                </span>
                <p
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    tx.category?.kind === "income" && "text-income",
                  )}
                >
                  {tx.category?.kind === "income" ? "+" : "−"}
                  {formatMoney(toMinor(tx.amount.value), tx.amount.currency.code)}
                </p>
                {actions && <TransactionActions transaction={tx} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
