"use client";
import { ErrorState } from "@/components/ui/states";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <ErrorState message="An unexpected error interrupted this page." retry={reset} />
    </main>
  );
}
