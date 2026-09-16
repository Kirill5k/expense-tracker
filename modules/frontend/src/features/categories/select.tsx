"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./icon";
import type { Category } from "./types";

type CategorySelectProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "value" | "onChange" | "children"
> & {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unavailableLabel?: string;
};

export const CategorySelect = forwardRef<HTMLButtonElement, CategorySelectProps>(
  function CategorySelect(
    {
      categories,
      value,
      onChange,
      placeholder = "Choose a category",
      unavailableLabel = "Unavailable category",
      disabled,
      className,
      ...props
    },
    ref,
  ) {
    const selected = categories.find((category) => category.id === value);
    return (
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            {...props}
            ref={ref}
            type="button"
            disabled={disabled}
            className={cn(
              "form-input flex items-center justify-between gap-3 py-2 text-left",
              className,
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              {value && <CategoryIcon category={selected} size={30} />}
              <span className={cn("truncate", !selected && "text-muted-foreground")}>
                {selected?.name ?? (value ? unavailableLabel : placeholder)}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className="z-50 min-w-56 overflow-y-auto rounded-2xl border bg-card p-2 shadow-lg"
            style={{
              width: "var(--radix-dropdown-menu-trigger-width)",
              maxHeight: "min(20rem, var(--radix-dropdown-menu-content-available-height))",
            }}
          >
            <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
              {value && !selected && (
                <DropdownMenu.RadioItem
                  value={value}
                  disabled
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground"
                >
                  <CategoryIcon size={32} />
                  <span>{unavailableLabel}</span>
                </DropdownMenu.RadioItem>
              )}
              {categories.map((category) => (
                <DropdownMenu.RadioItem
                  key={category.id}
                  value={category.id}
                  textValue={category.name}
                  aria-label={category.name}
                  className="flex min-h-12 cursor-default select-none items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-secondary"
                >
                  <CategoryIcon category={category} size={32} />
                  <span className="min-w-0 flex-1 break-words">{category.name}</span>
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    <DropdownMenu.ItemIndicator>
                      <Check className="size-4 text-primary" aria-hidden="true" />
                    </DropdownMenu.ItemIndicator>
                  </span>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            {!categories.length && (
              <p className="px-3 py-3 text-sm text-muted-foreground">No categories available.</p>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);
