import { RoutePlaceholder } from "@/components/dashboard/RoutePlaceholder";
import { SummaryCardsSection } from "@/components/dashboard/summary/SummaryCardsSection";

// TODO(#12): replace this placeholder with the alerts+map section.
// TODO(#13): replace this placeholder with the cost chart section.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page-level heading: SummaryCardsSection and the remaining placeholders
          below use their own (sr-only) h2, so this stays the page's only h1. */}
      <h1 className="sr-only">대시보드</h1>
      <SummaryCardsSection />
      <RoutePlaceholder title="알림 및 지도" headingLevel="h2" />
      <RoutePlaceholder title="비용 차트" headingLevel="h2" />
    </div>
  );
}
