"use client";
import { cloneElement, isValidElement, useId, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("form-input", className)} {...props} />;
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative inline-grid min-w-0">
      <select
        className={cn("form-input appearance-none cursor-pointer pr-11", className)}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const child = isValidElement<{ id?: string; "aria-describedby"?: string }>(children)
    ? children
    : null;
  const id = child?.props.id ?? generatedId;
  const descriptionId = error || hint ? `${id}-description` : undefined;
  return (
    <div className="grid min-w-0 content-start gap-2 text-sm">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {child
        ? cloneElement(child, {
            id,
            "aria-describedby":
              [child.props["aria-describedby"], descriptionId].filter(Boolean).join(" ") ||
              undefined,
          })
        : children}
      {error && (
        <span id={descriptionId} className="text-destructive" role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}
