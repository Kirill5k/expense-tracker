"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Archive, ArrowLeft, ArrowUpRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/fields";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/ui/states";
import { api, errorMessage, json } from "@/lib/api";
import { useCategories } from "./api";
import { CategoryIcon, iconOptions } from "./icon";
import type { Category, CategoryKind } from "./types";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(80, "Use 80 characters or fewer."),
  kind: z.enum(["expense", "income"]),
  icon: z.string().min(1, "Choose an icon."),
  color: z.string().regex(/^#(?:[a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/, "Enter a valid hex colour."),
});
type Values = z.infer<typeof schema>;
const colours = [
  "#2254F4",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#EAB308",
  "#14B8A6",
  "#22C55E",
  "#64748B",
];

export function CategoriesScreen() {
  const query = useCategories();
  const [kind, setKind] = useState<CategoryKind | "all">("all");
  const [search, setSearch] = useState("");
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  const filtered = query.data.filter(
    (category) =>
      (kind === "all" || category.kind === kind) &&
      category.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Your organisation"
        title="Categories"
        description="A place for every part of your spending."
        action={
          <Button asChild>
            <Link href="/categories/new">
              <Plus />
              New category
            </Link>
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full bg-secondary p-1" aria-label="Category type">
          {(["all", "expense", "income"] as const).map((value) => (
            <Button
              key={value}
              size="small"
              variant={kind === value ? "default" : "ghost"}
              onClick={() => setKind(value)}
              aria-pressed={kind === value}
            >
              {value === "all" ? "All categories" : value === "expense" ? "Expenses" : "Income"}
            </Button>
          ))}
        </div>
        <label className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-4 size-4 text-muted-foreground" />
          <Input
            className="pl-11"
            aria-label="Search categories"
            placeholder="Search categories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {!filtered.length ? (
        <div className="panel">
          <EmptyState
            title={query.data.length ? "No matching categories" : "Start with a category"}
            description={
              query.data.length
                ? "Try another name or category type."
                : "Create your first expense or income category to organise transactions."
            }
            action={
              !query.data.length && (
                <Button asChild>
                  <Link href="/categories/new">Create category</Link>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <Link
              href={`/categories/${category.id}`}
              key={category.id}
              className="panel group flex items-center gap-4 transition-shadow hover:shadow-md"
            >
              <CategoryIcon category={category} size={44} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{category.name}</h2>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{category.kind}</p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function CategoryEditorScreen({ id }: { id?: string }) {
  const query = useCategories();
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  const category = query.data.find((item) => item.id === id);
  if (id && !category)
    return (
      <div className="panel">
        <EmptyState
          title="Category unavailable"
          description="This category may have been archived or removed."
          action={
            <Button asChild>
              <Link href="/categories">Back to categories</Link>
            </Button>
          }
        />
      </div>
    );
  return <CategoryForm key={id ?? "new"} category={category} categories={query.data} />;
}

function CategoryForm({ category, categories }: { category?: Category; categories: Category[] }) {
  const router = useRouter();
  const client = useQueryClient();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: category ?? {
      name: "",
      kind: "expense",
      icon: iconOptions[0]?.value ?? "shape",
      color: colours[0],
    },
  });
  const [name, kind, icon, color] = useWatch({ control, name: ["name", "kind", "icon", "color"] });
  const preview = { name, kind, icon, color };
  const choices = iconOptions.some((item) => item.value === preview.icon)
    ? iconOptions
    : [{ value: preview.icon, label: `Current icon (${preview.icon})` }, ...iconOptions];
  async function save(values: Values) {
    setError("");
    if (
      categories.some(
        (item) => item.id !== category?.id && item.name.toLowerCase() === values.name.toLowerCase(),
      )
    ) {
      setError("A category with this name already exists.");
      return;
    }
    try {
      await api(
        category ? `categories/${category.id}` : "categories",
        json(category ? "PUT" : "POST", { ...values, ...(category ? { id: category.id } : {}) }),
      );
      await Promise.all(
        ["categories", "transactions", "transaction", "recurring", "user"].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      toast.success(category ? "Category updated" : "Category created");
      router.push("/categories");
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }
  async function archive() {
    if (!category) return;
    await api(`categories/${category.id}/hidden`, json("PUT", { hidden: true }));
    client.setQueriesData<Category[]>({ queryKey: ["categories"] }, (items) =>
      items?.filter((item) => item.id !== category.id),
    );
    await Promise.all(
      ["categories", "transactions", "transaction", "recurring", "user"].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
    toast.success("Category archived");
    router.push("/categories");
  }
  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" className="mb-5 -ml-4">
        <Link href="/categories">
          <ArrowLeft />
          Categories
        </Link>
      </Button>
      <PageHeading
        title={category ? "Edit category" : "New category"}
        description="Give it a name, a colour, and a little personality."
      />
      <form onSubmit={handleSubmit(save)} className="panel grid gap-6">
        <div className="flex items-center gap-4 rounded-2xl bg-background p-5">
          <CategoryIcon category={preview} size={48} />
          <div>
            <p className="font-semibold">{preview.name || "Your category"}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{preview.kind}</p>
          </div>
        </div>
        <Field label="Name" error={errors.name?.message}>
          <Input
            {...register("name")}
            placeholder="e.g. Groceries"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type" error={errors.kind?.message}>
            <Select {...register("kind")}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </Field>
          <Field label="Icon" error={errors.icon?.message}>
            <Select {...register("icon")}>
              {choices.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Colour</legend>
          <div className="mb-4 flex flex-wrap gap-3">
            {colours.map((colour) => (
              <button
                type="button"
                key={colour}
                onClick={() =>
                  setValue("color", colour, { shouldDirty: true, shouldValidate: true })
                }
                className="size-9 rounded-full border-4 border-card outline-offset-2"
                style={{
                  backgroundColor: colour,
                  outline:
                    preview.color.toLowerCase() === colour.toLowerCase()
                      ? `2px solid ${colour}`
                      : undefined,
                }}
                aria-label={`Use ${colour}`}
                aria-pressed={preview.color.toLowerCase() === colour.toLowerCase()}
              />
            ))}
          </div>
          <Field label="Custom colour" error={errors.color?.message}>
            <Input
              {...register("color")}
              placeholder="#2254F4"
              aria-invalid={Boolean(errors.color)}
            />
          </Field>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          <Button asChild variant="secondary">
            <Link href="/categories">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save category"}
          </Button>
        </div>
      </form>
      {category && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border p-6">
          <div>
            <p className="text-sm font-medium">Archive category</p>
            <p className="mt-1 text-xs text-muted-foreground">Remove it from your workspace.</p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={isSubmitting}>
                <Archive />
                Archive
              </Button>
            }
            title={`Archive ${category.name}?`}
            description="This also hides its transactions and stops its recurring transactions. They will no longer appear in your lists or totals. Archive cannot be undone from this web app."
            onConfirm={archive}
          />
        </div>
      )}
    </div>
  );
}
