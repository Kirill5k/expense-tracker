"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, json } from "@/lib/api";
import type { Recurring } from "./types";

export function StopRecurring({
  transaction,
  disabled,
  onStopped,
}: {
  transaction: Recurring;
  disabled?: boolean;
  onStopped?: () => void;
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
        <Button variant="outline" size="small" disabled={disabled} aria-label={`Stop ${label}`}>
          <Square className="size-3" />
          Stop
        </Button>
      }
      title={`Stop ${label}?`}
      description="This removes the schedule and stops future transactions. Transactions already in your history are kept."
      confirmLabel="Stop recurring transaction"
      onConfirm={stop}
    />
  );
}
