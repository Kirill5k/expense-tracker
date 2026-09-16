"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import { api, json, errorMessage } from "@/lib/api";
import { currencies, currencyFor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { Brand } from "@/components/layout/shell";
import { signIn } from "./api";

const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  firstName: z.string(),
  lastName: z.string(),
  currency: z.string(),
});
type Values = z.infer<typeof authSchema>;
export function AuthScreen({ registration = false }: { registration?: boolean }) {
  const router = useRouter(),
    client = useQueryClient();
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const schema = authSchema.superRefine((data, ctx) => {
    if (registration && !registered) {
      if (!data.firstName.trim())
        ctx.addIssue({ code: "custom", path: ["firstName"], message: "Enter your first name." });
      if (!data.lastName.trim())
        ctx.addIssue({ code: "custom", path: ["lastName"], message: "Enter your last name." });
      if (data.password.length < 8)
        ctx.addIssue({ code: "custom", path: ["password"], message: "Use at least 8 characters." });
    }
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", currency: "GBP" },
  });
  async function submit(values: Values) {
    setError("");
    try {
      if (registration && !registered) {
        await api<{ id: string }>(
          "auth/user",
          json("POST", {
            ...values,
            email: values.email.toLowerCase(),
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            currency: currencyFor(values.currency),
          }),
        );
        setRegistered(true);
      }
      await client.cancelQueries();
      await signIn(values.email.toLowerCase(), values.password);
      client.clear();
      router.replace("/");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  const { errors, isSubmitting } = form.formState;
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col bg-card px-6 py-8 sm:px-12 lg:px-16">
        <Link href="/signin" className="self-start">
          <Brand />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="mb-3 text-sm font-medium text-primary">A little clarity goes a long way</p>
          <h1 className="text-4xl font-semibold">
            {registered
              ? "You’re all set."
              : registration
                ? "Make room for clarity."
                : "Welcome back."}
          </h1>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
            {registered
              ? "Your account is ready. Sign in to get started."
              : registration
                ? "Bring your everyday money into focus."
                : "Your everyday money, all in one place."}
          </p>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-5" noValidate>
            {registration && !registered && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" error={errors.firstName?.message}>
                  <Input
                    autoComplete="given-name"
                    {...form.register("firstName")}
                    aria-invalid={Boolean(errors.firstName)}
                  />
                </Field>
                <Field label="Last name" error={errors.lastName?.message}>
                  <Input
                    autoComplete="family-name"
                    {...form.register("lastName")}
                    aria-invalid={Boolean(errors.lastName)}
                  />
                </Field>
              </div>
            )}
            <Field label="Email address" error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                {...form.register("email")}
                aria-invalid={Boolean(errors.email)}
              />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete={registration && !registered ? "new-password" : "current-password"}
                {...form.register("password")}
                aria-invalid={Boolean(errors.password)}
              />
            </Field>
            {registration && !registered && (
              <Field
                label="Default currency"
                hint="You can change this later. Existing transactions keep their own currency."
              >
                <Select {...form.register("currency")}>
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.symbol}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="mt-1 min-h-12">
              {isSubmitting
                ? "Please wait…"
                : registration && !registered
                  ? "Create account"
                  : "Sign in"}
              <ArrowUpRight />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {registration ? "Already have an account?" : "New here?"}{" "}
            <Link
              className="font-semibold text-primary hover:underline"
              href={registration ? "/signin" : "/signup"}
            >
              {registration ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3" />
          Your money story stays yours.
        </p>
      </section>
      <section className="hidden flex-col justify-center p-12 lg:flex xl:p-20">
        <div className="max-w-lg">
          <span className="mb-7 inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
            A fresh perspective
          </span>
          <h2 className="text-5xl font-semibold leading-tight">
            Less wondering.
            <br />
            More knowing.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
            See where your money goes, find your rhythm, and make your next move with confidence.
          </p>
          <div className="mt-10 rounded-3xl bg-card p-7">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Everything in perspective</span>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-4" />
              </span>
            </div>
            <div className="mt-7 flex items-end gap-2" aria-hidden="true">
              {[36, 52, 44, 72, 60, 90, 77, 110, 96, 132, 118, 150].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg bg-primary"
                  style={{ height, opacity: 0.25 + i * 0.06 }}
                />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-6 border-t border-border pt-5 text-sm">
              <span className="flex items-center gap-2">
                <ArrowDownLeft className="size-4 text-income" />
                Income
              </span>
              <span className="flex items-center gap-2">
                <ArrowUpRight className="size-4 text-expense" />
                Spending
              </span>
              <span className="ml-auto text-xs text-muted-foreground">Illustration</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
