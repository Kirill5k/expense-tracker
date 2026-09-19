"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Ellipsis, Pencil, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, json } from "@/lib/api";
import type { Recurring } from "./types";

export function StopRecurring({
  transaction,
  disabled,
  onStopped,
  menuItem = false,
}: {
  transaction: Recurring;
  disabled?: boolean;
  onStopped?: () => void;
  menuItem?: boolean;
}) {
  const client = useQueryClient();
  const label = transaction.note || transaction.category?.name || "this schedule";
  async function stop() {
    await api(`periodic-transactions/${transaction.id}/hidden`, json("PUT", { hidden: true }));
    client.setQueriesData<Recurring[]>({ queryKey: ["recurring"] }, (items) =>
      items?.filter((item) => item.id !== transaction.id),
    );
    await client.invalidateQueries({ queryKey: ["recurring"] });
    toast.success("Recurring transaction stopped");
    onStopped?.();
  }
  return (
    <ConfirmDialog
      trigger={
        menuItem ? (
          <Dropdown.Item
            disabled={disabled}
            // Keep this item's confirmation dialog mounted while it is open.
            onSelect={(event) => event.preventDefault()}
            className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm text-destructive outline-none focus:bg-secondary"
          >
            <Square className="size-4" />
            Stop
          </Dropdown.Item>
        ) : (
          <Button variant="outline" size="small" disabled={disabled} aria-label={`Stop ${label}`}>
            <Square className="size-3" />
            Stop
          </Button>
        )
      }
      title={`Stop ${label}?`}
      description="This removes the schedule and stops future transactions. Transactions already in your history are kept."
      confirmLabel="Stop recurring transaction"
      onConfirm={stop}
    />
  );
}

export function RecurringActions({ transaction }: { transaction: Recurring }) {
  const label = transaction.note || transaction.category?.name || "schedule";
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${label}`}>
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
              href={`/recurring/${transaction.id}`}
              className="flex items-center gap-3 rounded-xl p-3 text-sm outline-none focus:bg-secondary"
            >
              <Pencil className="size-4" />
              Edit
            </Link>
          </Dropdown.Item>
          <StopRecurring transaction={transaction} menuItem />
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
