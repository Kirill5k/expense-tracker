import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export type Period = "week" | "month" | "year" | "custom";
export type DateRange = { from: string; to: string };
export const dateString = (date: Date) => format(date, "yyyy-MM-dd");
export const today = () => dateString(new Date());
export const isDateString = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  isValid(parseISO(value)) &&
  dateString(parseISO(value)) === value;

export function periodRange(period: Exclude<Period, "custom">, anchor = new Date()): DateRange {
  const bounds =
    period === "week"
      ? [startOfWeek(anchor), endOfWeek(anchor)]
      : period === "year"
        ? [startOfYear(anchor), endOfYear(anchor)]
        : [startOfMonth(anchor), endOfMonth(anchor)];
  return { from: dateString(bounds[0]), to: dateString(bounds[1]) };
}

export function shiftRange(range: DateRange, period: Period, direction: number): DateRange {
  const from = parseISO(range.from);
  if (period === "custom") {
    const days = (differenceInCalendarDays(parseISO(range.to), from) + 1) * direction;
    return {
      from: dateString(addDays(from, days)),
      to: dateString(addDays(parseISO(range.to), days)),
    };
  }
  return periodRange(
    period,
    period === "week"
      ? addWeeks(from, direction)
      : period === "year"
        ? addYears(from, direction)
        : addMonths(from, direction),
  );
}

export function rangeQuery(range?: DateRange): string {
  if (!range) return "";
  return `?${new URLSearchParams({ from: `${range.from}T00:00:00.000Z`, to: `${dateString(addDays(parseISO(range.to), 1))}T00:00:00.000Z` })}`;
}

export function rangeLabel(range: DateRange, period: Period): string {
  const from = parseISO(range.from);
  return period === "month"
    ? format(from, "MMMM yyyy")
    : period === "year"
      ? format(from, "yyyy")
      : `${format(from, "d MMM")} – ${format(parseISO(range.to), "d MMM yyyy")}`;
}

export function visibleDate(
  date: string,
  futureDays: number | null,
  currentDay = today(),
): boolean {
  return futureDays === null || date <= dateString(addDays(parseISO(currentDay), futureDays));
}
