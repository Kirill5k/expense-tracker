"use client";

import { useId, type ComponentProps } from "react";
import type { Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

export function AmountInput({
  currency,
  className,
  "aria-describedby": describedBy,
  ...props
}: ComponentProps<"input"> & { currency: Currency }) {
  const currencyId = useId();
  return (
    <div
      data-slot="amount-input"
      className={cn(
        "flex min-h-20 min-w-0 items-center gap-3 rounded-2xl border bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        props["aria-invalid"] && "border-destructive",
        className,
      )}
    >
      <span
        data-slot="currency-symbol"
        aria-hidden="true"
        className="shrink-0 text-3xl font-semibold"
      >
        {currency.symbol}
      </span>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        aria-describedby={[describedBy, currencyId].filter(Boolean).join(" ")}
        className="min-w-0 flex-1 bg-transparent py-5 text-3xl font-semibold tabular-nums outline-none disabled:opacity-60"
      />
      <span aria-hidden="true" className="shrink-0 text-xs font-medium text-muted-foreground">
        {currency.code}
      </span>
      <span id={currencyId} className="sr-only">
        Amount in {currency.code}
      </span>
    </div>
  );
}
