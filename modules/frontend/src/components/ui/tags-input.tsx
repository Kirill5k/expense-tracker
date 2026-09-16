"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type TagsState = { value: string; tags: string[]; draft: string };

export function readTagsInput(value: string): TagsState {
  return {
    value,
    tags: value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    draft: "",
  };
}

function serialize(tags: string[], draft: string): TagsState {
  return { value: [...tags, ...(draft ? [draft] : [])].join(", "), tags, draft };
}

export function editTagsInput(state: TagsState, input: string, commit = false): TagsState {
  const parts = input.split(",");
  const draft = commit ? "" : (parts.pop() ?? "");
  const tags = [...state.tags];
  for (const part of parts) {
    const tag = part.trim();
    if (tag && !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase()))
      tags.push(tag);
  }
  return serialize(tags, draft);
}

export function removeTagInput(state: TagsState, index: number): TagsState {
  return serialize(
    state.tags.filter((_, position) => position !== index),
    state.draft,
  );
}

type TagsInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "value" | "onChange" | "type" | "defaultValue"
> & {
  value: string;
  onChange: (value: string) => void;
};

export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(function TagsInput(
  { value, onChange, onBlur, onKeyDown, disabled, className, placeholder = "Add a tag…", ...props },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current!);
  const [local, setLocal] = useState(() => readTagsInput(value));
  let state = local;
  if (value !== local.value) {
    state = readTagsInput(value);
    setLocal(state);
  }

  function update(next: TagsState) {
    setLocal(next);
    if (next.value !== value) onChange(next.value);
  }

  function remove(index: number) {
    update(removeTagInput(state, index));
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn(
        "form-input flex min-w-0 flex-wrap items-center gap-2 px-3 py-2 focus-within:border-primary",
        disabled && "opacity-60",
        className,
      )}
      aria-invalid={props["aria-invalid"]}
    >
      {state.tags.map((tag, index) => (
        <span
          key={`${index}-${tag}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm"
        >
          <span className="min-w-0 break-words">{tag}</span>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Remove tag ${tag}`}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-default"
            onClick={() => remove(index)}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        {...props}
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={state.draft}
        placeholder={placeholder}
        className="min-w-24 flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        onChange={(event) => update(editTagsInput(state, event.target.value))}
        onBlur={(event) => {
          if (state.draft) update(editTagsInput(state, state.draft, true));
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            if (state.draft) update(editTagsInput(state, state.draft, true));
          } else if (event.key === "Backspace" && !state.draft && state.tags.length) {
            event.preventDefault();
            remove(state.tags.length - 1);
          }
        }}
      />
    </div>
  );
});
