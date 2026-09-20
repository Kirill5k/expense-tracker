import { Shell } from "@/components/layout/shell";
import { ReportPeriodProvider } from "@/components/layout/report-period-provider";
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReportPeriodProvider>
      <Shell>{children}</Shell>
    </ReportPeriodProvider>
  );
}
