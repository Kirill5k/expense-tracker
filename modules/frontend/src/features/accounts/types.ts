import type { Currency } from "@/lib/money";
export type Account = { id: string; name: string; currency: Currency; isMain: boolean };
