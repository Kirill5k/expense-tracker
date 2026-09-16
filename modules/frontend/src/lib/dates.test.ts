import { describe, expect, it } from "vitest";
import { isDateString, periodRange, rangeQuery, shiftRange, visibleDate } from "./dates";
describe("calendar boundaries", () => {
  it("uses an exclusive UTC end even across DST", () => {
    const query = new URLSearchParams(
      rangeQuery({ from: "2026-03-28", to: "2026-03-29" }).slice(1),
    );
    expect(query.get("from")).toBe("2026-03-28T00:00:00.000Z");
    expect(query.get("to")).toBe("2026-03-30T00:00:00.000Z");
  });
  it("rejects calendar overflow and preserves leap days", () => {
    expect(isDateString("2026-02-29")).toBe(false);
    expect(isDateString("2024-02-29")).toBe(true);
    expect(isDateString("2026-13-01")).toBe(false);
  });
  it("navigates complete months across year boundaries", () => {
    expect(shiftRange({ from: "2026-01-01", to: "2026-01-31" }, "month", -1)).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });
  it("keeps custom comparison periods equal length", () => {
    expect(shiftRange({ from: "2026-03-01", to: "2026-03-03" }, "custom", -1)).toEqual({
      from: "2026-02-26",
      to: "2026-02-28",
    });
  });
  it("matches Sunday-start mobile weeks", () => {
    expect(periodRange("week", new Date(2026, 8, 15))).toEqual({
      from: "2026-09-13",
      to: "2026-09-19",
    });
  });
  it("distinguishes no future data, limited days and all future data", () => {
    expect(visibleDate("2026-09-16", 0, "2026-09-15")).toBe(false);
    expect(visibleDate("2026-09-22", 7, "2026-09-15")).toBe(true);
    expect(visibleDate("2026-09-23", 7, "2026-09-15")).toBe(false);
    expect(visibleDate("2030-01-01", null, "2026-09-15")).toBe(true);
  });
});
