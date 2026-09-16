import type { ReactNode } from "react";
import { ArrowUpRight, CircleAlert, Inbox } from "lucide-react";
import { Button } from "./button";
export function LoadingState() {
  return (
    <div role="status" aria-label="Loading" className="grid gap-5">
      <span className="sr-only">Loading your workspace…</span>
      <div className="h-8 w-40 rounded-full bg-secondary" />
      <div className="h-64 rounded-3xl bg-secondary" />
      <div className="h-48 rounded-3xl bg-secondary" />
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center gap-4 py-14 text-center" role="alert">
      <CircleAlert className="size-9 text-destructive" />
      <h2 className="text-lg font-semibold">We couldn’t load this just yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {retry && <Button onClick={retry}>Try again</Button>}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
        <Inbox className="size-6 text-muted-foreground" />
      </span>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
export { ArrowUpRight };
