"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ArrowDownUp,
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleHelp,
  Ellipsis,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Repeat2,
  Settings2,
  Wallet,
} from "lucide-react";
import { useUser, signOut } from "@/features/auth/api";
import { ApiError, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { toast } from "sonner";
import { useDataCleanup } from "@/features/settings/cleanup";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowDownUp },
  { href: "/recurring", label: "Recurring", icon: Repeat2 },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Grid2X2 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];
export function Brand() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
        <ArrowUpRight className="size-6" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-semibold">
        expense<span className="text-muted-foreground">tracker</span>
      </span>
    </span>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    client = useQueryClient();
  const user = useUser();
  const cleanup = useDataCleanup(user.data?.id);
  const { setTheme } = useTheme();
  const theme = user.data?.settings.darkMode;
  const hasUser = Boolean(user.data);
  useEffect(() => {
    if (hasUser)
      setTheme(theme === null || theme === undefined ? "system" : theme ? "dark" : "light");
  }, [theme, hasUser, setTheme]);
  useEffect(() => {
    if (user.error instanceof ApiError && user.error.code === "SESSION_EXPIRED")
      router.replace("/signin");
  }, [user.error, router]);
  if (user.isPending)
    return (
      <main className="mx-auto max-w-5xl p-8">
        <LoadingState />
      </main>
    );
  if (user.error || !user.data)
    return (
      <main className="mx-auto max-w-xl p-8">
        <ErrorState
          message={errorMessage(user.error)}
          retry={() => {
            void user.refetch();
          }}
        />
      </main>
    );
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  async function logout() {
    await client.cancelQueries();
    try {
      await signOut();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      client.clear();
      router.replace("/signin");
    }
  }
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card px-5 py-8 lg:flex">
        <Link href="/" className="px-2" aria-label="Expense Tracker overview">
          <Brand />
        </Link>
        <nav aria-label="Main navigation" className="mt-12 grid gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary",
                active(href) && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl bg-background p-4">
            <ChartNoAxesCombined className="mb-3 size-5 text-primary" />
            <p className="text-sm font-semibold">Your money, made clear.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A little perspective on your everyday spending.
            </p>
          </div>
          <button
            onClick={() => {
              void logout();
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="flex h-20 items-center justify-between gap-4 px-5 sm:px-9 lg:px-12">
          <div className="lg:hidden">
            <Link href="/" aria-label="Expense Tracker overview">
              <Brand />
            </Link>
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            A clearer picture of your money
          </p>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              aria-label="Open settings"
            >
              <Link href="/settings">
                <CircleHelp />
              </Link>
            </Button>
            <Link
              href="/settings"
              aria-label={`Settings for ${user.data.firstName}`}
              className="flex size-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
            >
              {user.data.firstName[0]}
              {user.data.lastName[0]}
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-7xl px-5 pb-28 pt-4 sm:px-9 lg:px-12 lg:pb-12"
        >
          {cleanup.pending ? (
            <section className="panel mx-auto max-w-xl py-12 text-center" role="status">
              <h1 className="text-2xl font-semibold">Clearing your data</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                We’re waiting for your transactions, schedules, categories, and accounts to finish
                clearing. Your workspace will reopen when this is complete.
              </p>
              {cleanup.error && (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {cleanup.error}
                </p>
              )}
              {cleanup.error && (
                <Button
                  className="mt-5"
                  disabled={cleanup.isChecking}
                  onClick={() => {
                    void cleanup.retry();
                  }}
                >
                  Retry cleanup
                </Button>
              )}
            </section>
          ) : (
            children
          )}
        </main>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      >
        {links.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] leading-4 font-medium text-muted-foreground",
              active(href) && "text-primary",
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
              {/* Match the wallet's taller artwork to the neighboring arrow icons. */}
              <Icon className={href === "/accounts" ? "size-[18px]" : "size-5"} />
            </span>
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        ))}
        <Dropdown.Root>
          <Dropdown.Trigger
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] leading-4 font-medium text-muted-foreground",
              links.slice(4).some((link) => active(link.href)) && "text-primary",
            )}
          >
            <Ellipsis className="size-5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">More</span>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content
              side="top"
              align="end"
              sideOffset={14}
              className="z-50 min-w-48 rounded-2xl border border-border bg-card p-2 shadow-lg"
            >
              {links.slice(4).map(({ href, label, icon: Icon }) => (
                <Dropdown.Item key={href} asChild>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-xl p-3 text-sm outline-none focus:bg-secondary"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </Dropdown.Item>
              ))}
              <Dropdown.Separator className="my-1 h-px bg-border" />
              <Dropdown.Item
                onSelect={() => {
                  void logout();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm outline-none focus:bg-secondary"
              >
                <LogOut className="size-4" />
                Sign out
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </nav>
    </div>
  );
}
