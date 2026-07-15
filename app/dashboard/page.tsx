import { RoutePlaceholder } from "@/components/dashboard/RoutePlaceholder";
import { CostChartSection } from "@/components/dashboard/cost-chart/CostChartSection";
import { SummaryCardsSection } from "@/components/dashboard/summary/SummaryCardsSection";

// TODO(#12): replace this placeholder with the alerts+map section.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page-level heading: SummaryCardsSection and the remaining placeholder
          below use their own (visible or sr-only) h2, so this stays the page's
          only h1. */}
      <h1 className="sr-only">대시보드</h1>
      <SummaryCardsSection />
      <RoutePlaceholder title="알림 및 지도" headingLevel="h2" />
      <CostChartSection />
    </div>
  );
}
