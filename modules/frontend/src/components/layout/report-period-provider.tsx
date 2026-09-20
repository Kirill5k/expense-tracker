"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { periodRange, type DateRange, type Period } from "@/lib/dates";

export type ReportPeriodSelection = { period: Period; range: DateRange };

const ReportPeriodContext = createContext<{
  selection: ReportPeriodSelection;
  setSelection: (selection: ReportPeriodSelection) => void;
} | null>(null);

export function ReportPeriodProvider({ children }: { children: ReactNode }) {
  const [selection, setStoredSelection] = useState<ReportPeriodSelection>(() => ({
    period: "month",
    range: periodRange("month"),
  }));
  const setSelection = useCallback((next: ReportPeriodSelection) => {
    setStoredSelection((current) =>
      current.period === next.period &&
      current.range.from === next.range.from &&
      current.range.to === next.range.to
        ? current
        : next,
    );
  }, []);
  const value = useMemo(() => ({ selection, setSelection }), [selection, setSelection]);
  return <ReportPeriodContext.Provider value={value}>{children}</ReportPeriodContext.Provider>;
}

export function useReportPeriod() {
  const context = useContext(ReportPeriodContext);
  if (!context) throw new Error("Report filters require ReportPeriodProvider.");
  return context;
}
