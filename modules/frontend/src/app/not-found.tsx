import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center gap-5 p-8 text-center">
      <h1 className="text-3xl font-semibold">This page isn’t here</h1>
      <p className="text-muted-foreground">Head back to your overview to continue.</p>
      <Button asChild>
        <Link href="/">Go to overview</Link>
      </Button>
    </main>
  );
}
