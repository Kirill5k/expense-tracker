import { expect, it } from "vitest";
import { percentageChange, spendingTrend } from "./selectors";
it("does not invent percentage changes when the previous period is zero", () => {
  expect(percentageChange(100, 0)).toBeNull();
  expect(percentageChange(50, 100)).toBe(-50);
});
it("fills complete calendar buckets across month boundaries", () => {
  const rows = spendingTrend([], { from: "2024-02-28", to: "2024-03-01" });
  expect(rows.map((row) => row.date)).toEqual(["2024-02-28", "2024-02-29", "2024-03-01"]);
});
