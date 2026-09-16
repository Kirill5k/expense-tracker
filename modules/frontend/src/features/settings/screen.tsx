"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, LockKeyhole, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/fields";
import { ErrorState, LoadingState, PageHeading } from "@/components/ui/states";
import { useUser } from "@/features/auth/api";
import type { User, UserSettings } from "@/features/auth/types";
import { api, errorMessage, json } from "@/lib/api";
import { currencies, currencyFor } from "@/lib/money";
import { requestDataCleanup, useDataCleanup } from "./cleanup";

const preferenceSchema = z.object({
  currency: z.string().min(1, "Choose a currency."),
  theme: z.enum(["system", "light", "dark"]),
  futureDays: z
    .string()
    .refine((value) => value === "all" || /^\d+$/.test(value), "Choose a future visibility range."),
});
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmation: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmation, {
    message: "Passwords do not match.",
    path: ["confirmation"],
  });

export function SettingsScreen() {
  const query = useUser();
  const cleanup = useDataCleanup(query.data?.id);
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  if (cleanup.pending)
    return (
      <div className="panel">
        <h1 className="text-xl font-semibold">Clearing your data</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We are confirming that your transactions, categories, recurring transactions, and accounts
          have been removed. This may take a little time.
        </p>
        {cleanup.error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {cleanup.error}
          </p>
        )}
        <Button
          className="mt-5"
          variant="secondary"
          disabled={cleanup.isChecking}
          onClick={() => void cleanup.retry()}
        >
          Retry cleanup
        </Button>
      </div>
    );
  return (
    <>
      <PageHeading
        eyebrow="Your workspace"
        title="Settings"
        description="Make Expense Tracker feel like you."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.35fr]">
        <div className="grid gap-6">
          <section className="panel">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                {query.data.firstName.charAt(0)}
                {query.data.lastName.charAt(0)}
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {query.data.firstName} {query.data.lastName}
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">{query.data.email}</p>
              </div>
            </div>
            <div className="grid gap-4 border-t pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" />
                Member since{" "}
                {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
                  new Date(query.data.registrationDate),
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-semibold tabular-nums">
                  {query.data.totalTransactionCount === null
                    ? "Unavailable"
                    : query.data.totalTransactionCount.toLocaleString("en-GB")}
                </span>
              </div>
            </div>
          </section>
          <PasswordForm userId={query.data.id} />
        </div>
        <div className="grid gap-6">
          <PreferencesForm user={query.data} />
          <DangerZone userId={query.data.id} />
        </div>
      </div>
    </>
  );
}

function PreferencesForm({ user }: { user: User }) {
  const { setTheme } = useTheme();
  const client = useQueryClient();
  const [error, setError] = useState("");
  const futureDays = user.settings.futureTransactionVisibilityDays ?? null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof preferenceSchema>>({
    resolver: zodResolver(preferenceSchema),
    defaultValues: {
      currency: user.settings.currency.code,
      theme: user.settings.darkMode === null ? "system" : user.settings.darkMode ? "dark" : "light",
      futureDays: futureDays === null ? "all" : String(futureDays),
    },
  });
  const currencyOptions = currencies.some(
    (currency) => currency.code === user.settings.currency.code,
  )
    ? currencies
    : [user.settings.currency, ...currencies];
  const dayOptions = [0, 7, 14, 30];
  if (futureDays !== null && !dayOptions.includes(futureDays)) dayOptions.push(futureDays);
  async function save(values: z.infer<typeof preferenceSchema>) {
    setError("");
    const days = values.futureDays === "all" ? null : Number(values.futureDays);
    const settings: UserSettings = {
      currency:
        values.currency === user.settings.currency.code
          ? user.settings.currency
          : currencyFor(values.currency),
      darkMode: values.theme === "system" ? null : values.theme === "dark",
      hideFutureTransactions: days === 0,
      futureTransactionVisibilityDays: days,
    };
    try {
      await api(`auth/user/${user.id}/settings`, json("PUT", settings));
      client.setQueryData<User>(["user"], { ...user, settings });
      setTheme(values.theme);
      reset(values);
      await client.invalidateQueries({ queryKey: ["user"] });
      toast.success("Preferences saved");
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }
  return (
    <section className="panel">
      <div className="mb-6 flex items-center gap-3">
        <Settings2 className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Preferences</h2>
      </div>
      <form onSubmit={handleSubmit(save)} className="grid gap-6">
        <Field
          label="Default currency"
          error={errors.currency?.message}
          hint="Used for unassigned transactions and as your starting report currency. Existing amounts and account currencies stay the same."
        >
          <Select {...register("currency")}>
            {currencyOptions.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} — {currency.symbol}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Appearance">
          <Select {...register("theme")}>
            <option value="system">Use device setting</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </Field>
        <Field
          label="Future transactions"
          error={errors.futureDays?.message}
          hint="Choose how far ahead your transaction lists and reports look. Recurring schedules stay visible."
        >
          <Select {...register("futureDays")}>
            {dayOptions
              .sort((a, b) => a - b)
              .map((days) => (
                <option key={days} value={days}>
                  {days === 0 ? "Today and earlier" : `Show the next ${days} days`}
                </option>
              ))}
            <option value="all">Show all dates</option>
          </Select>
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end border-t pt-5">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm({ userId }: { userId: string }) {
  const client = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });
  async function save(values: z.infer<typeof passwordSchema>) {
    setError("");
    try {
      await api(
        `auth/user/${userId}/password`,
        json("POST", { currentPassword: values.currentPassword, newPassword: values.newPassword }),
      );
      await client.cancelQueries();
      client.clear();
      toast.success("Password changed. Sign in again with your new password.");
      router.replace("/signin");
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }
  return (
    <section className="panel">
      <div className="mb-6 flex items-center gap-3">
        <LockKeyhole className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Password</h2>
      </div>
      <form onSubmit={handleSubmit(save)} className="grid gap-5">
        <Field label="Current password" error={errors.currentPassword?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            {...register("currentPassword")}
            aria-invalid={Boolean(errors.currentPassword)}
          />
        </Field>
        <Field label="New password" error={errors.newPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
            aria-invalid={Boolean(errors.newPassword)}
          />
        </Field>
        <Field label="Confirm new password" error={errors.confirmation?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("confirmation")}
            aria-invalid={Boolean(errors.confirmation)}
          />
        </Field>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Changing your password signs you out on every device.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button variant="outline" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
          <ArrowRight />
        </Button>
      </form>
    </section>
  );
}

function DangerZone({ userId }: { userId: string }) {
  const client = useQueryClient();
  const router = useRouter();
  async function clearData() {
    await requestDataCleanup(userId, client);
  }
  async function closeAccount() {
    await api("auth/user", json("DELETE"));
    await client.cancelQueries();
    client.clear();
    toast.success("Your account and financial data have been removed.");
    router.replace("/signin");
  }
  return (
    <section className="rounded-3xl border p-6">
      <div className="mb-6 flex items-center gap-3">
        <Trash2 className="size-5 text-destructive" />
        <h2 className="text-lg font-semibold">Data & account</h2>
      </div>
      <div className="grid gap-6">
        <div>
          <h3 className="text-sm font-semibold">Clear all financial data</h3>
          <p className="mb-4 mt-2 text-xs leading-relaxed text-muted-foreground">
            Permanently remove your server-stored transactions, recurring transactions, categories,
            and accounts. Your sign-in and preferences remain.
          </p>
          <ConfirmDialog
            trigger={<Button variant="outline">Clear all data</Button>}
            title="Clear all your financial data?"
            description="This removes your financial records from the server. Copies on mobile devices are not cleared, and pending mobile changes can restore records when they sync. Your sign-in and preferences are kept. You will need to create new categories and accounts to start again."
            confirmLabel="Clear all data"
            typed
            onConfirm={clearData}
          />
        </div>
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold">Close your account</h3>
          <p className="mb-4 mt-2 text-xs leading-relaxed text-muted-foreground">
            Permanently remove your Expense Tracker account and all its financial data.
          </p>
          <ConfirmDialog
            trigger={<Button variant="destructive">Close account</Button>}
            title="Permanently close your account?"
            description="Your sign-in and all your financial data will be permanently removed. This cannot be undone."
            confirmLabel="Close account"
            typed
            onConfirm={closeAccount}
          />
        </div>
      </div>
    </section>
  );
}
