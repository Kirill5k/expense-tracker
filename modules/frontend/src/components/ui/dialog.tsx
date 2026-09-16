"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  sheet = false,
}: {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sheet?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 max-h-[90dvh] overflow-y-auto bg-card p-6 shadow-xl outline-none",
            sheet
              ? "inset-x-0 bottom-0 rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:top-0 sm:max-h-dvh sm:w-96 sm:rounded-none"
              : "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl",
          )}
        >
          <DialogPrimitive.Title className="pr-10 text-xl font-semibold">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description
            className={cn("mt-2 text-sm text-muted-foreground", !description && "sr-only")}
          >
            {description ?? title}
          </DialogPrimitive.Description>
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close dialog"
              className="absolute right-3 top-3"
            >
              <X />
            </Button>
          </DialogPrimitive.Close>
          <div className="mt-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
