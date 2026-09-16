"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useState, type ReactNode } from "react";
import { errorMessage } from "@/lib/api";
import { Button } from "./button";
import { Field, Input } from "./fields";
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Archive",
  typed = false,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  typed?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    setPending(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setOpen(value);
          setError("");
          setConfirmation("");
        }
      }}
    >
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-7 shadow-xl">
          <AlertDialog.Title className="text-xl font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mb-6 mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </AlertDialog.Description>
          {typed && (
            <Field label="Type DELETE to confirm">
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                disabled={pending}
              />
            </Field>
          )}
          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={pending}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant="destructive"
                disabled={pending || (typed && confirmation !== "DELETE")}
                onClick={(e) => {
                  e.preventDefault();
                  void confirm();
                }}
              >
                {pending ? "Working…" : confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
