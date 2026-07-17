import { VehicleDetailSection } from "@/components/dashboard/vehicles/VehicleDetailSection";
import { parseVehicleDetailTab, parseVehicleUsagePage } from "@/lib/dashboard/vehicles/tab-url";

/**
 * `/dashboard/vehicles/[vehicleId]` (issue #15). Server Component — only
 * `params.vehicleId` and the 2 relevant `searchParams` (`tab`/`page`) are
 * read here and passed down as typed props, matching the `#14` list page
 * precedent (CLAUDE.md §4: "정적 route는 page의 searchParams 전달을 우선
 * 검토"); the client tree never calls `useSearchParams()` itself.
 */
export default function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: { vehicleId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = parseVehicleDetailTab(searchParams.tab);
  const page = parseVehicleUsagePage(searchParams.page);

  return <VehicleDetailSection vehicleId={params.vehicleId} tab={tab} page={page} />;
}
