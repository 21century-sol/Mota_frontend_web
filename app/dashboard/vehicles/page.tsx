import { SummaryCardsSection } from "@/components/dashboard/summary/SummaryCardsSection";
import { VehicleListSection } from "@/components/dashboard/vehicles/VehicleListSection";
import { parseVehicleListFilters } from "@/lib/dashboard/vehicles/url";

/**
 * `/dashboard/vehicles` (issue #14). Server Component — `searchParams` is read
 * here and passed down as a typed `filters` prop instead of the client tree
 * calling `useSearchParams()` itself (CLAUDE.md §4), so no `Suspense`
 * boundary is needed for the filter state.
 *
 * The 4 summary cards (Figma nodes 2467:25904/25909/25914/25919, PM Decision
 * 9, `.claude/handoffs/14-pm-breakdown.md`) reuse `SummaryCardsSection` as-is
 * (issue #11, protected) with its own independent query — never merged with
 * the vehicle list query below.
 */
export default function VehiclesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filters = parseVehicleListFilters(searchParams);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">차량 관리</h1>
      <SummaryCardsSection />
      <VehicleListSection filters={filters} />
    </div>
  );
}
