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
    // Figma vertical rhythm (node 1:13261): Dashboard gap 28px → [Header gap 20px
    // [title, summary cards], Vehicle Filter Section].
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-5">
        <h1 className="m-0 px-2 text-2xl font-medium leading-[1.5] tracking-[-0.6px] text-dashboard-vehicles-title">
          차량 관리
        </h1>
        <SummaryCardsSection variant="vehicles" />
      </div>
      <VehicleListSection filters={filters} />
    </div>
  );
}
