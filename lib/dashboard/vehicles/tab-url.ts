/**
 * Pure URL build/parse functions for the `/dashboard/vehicles/[vehicleId]`
 * 4-tab layout (issue #15, PM AC12/AC13). Same precedent as
 * `lib/dashboard/vehicles/url.ts` (issue #14): the Server Component page reads
 * `searchParams` and passes typed props down; only click handlers build the
 * next href.
 */
export type VehicleDetailTab = "tires" | "usage" | "inspection" | "info";

export const VEHICLE_DETAIL_TABS: readonly VehicleDetailTab[] = [
  "tires",
  "usage",
  "inspection",
  "info",
] as const;

/** The tires tab is the default and never appears in the URL (PM AC12). */
export const DEFAULT_VEHICLE_DETAIL_TAB: VehicleDetailTab = "tires";

export function isVehicleDetailTab(value: unknown): value is VehicleDetailTab {
  return (
    typeof value === "string" &&
    (VEHICLE_DETAIL_TABS as readonly string[]).includes(value)
  );
}

/** An unrecognized/missing `tab` query value degrades to the default tab instead of throwing. */
export function parseVehicleDetailTab(
  value: string | string[] | undefined,
): VehicleDetailTab {
  return typeof value === "string" && isVehicleDetailTab(value)
    ? value
    : DEFAULT_VEHICLE_DETAIL_TAB;
}

/** A missing/non-positive/non-integer `page` query value degrades to page 1 instead of throwing. */
export function parseVehicleUsagePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function vehicleDetailBasePath(vehicleId: string): string {
  return `/dashboard/vehicles/${vehicleId}`;
}

export const VEHICLE_DETAIL_LIST_PATH = "/dashboard/vehicles";

/**
 * `tab` is omitted for the default tab (PM AC12); `page` is only ever written
 * for the usage-history tab, and omitted at page 1 (PM AC19: `?tab=usage&page=N`).
 */
export function buildVehicleDetailHref(
  vehicleId: string,
  tab: VehicleDetailTab,
  page?: number,
): string {
  const params = new URLSearchParams();
  if (tab !== DEFAULT_VEHICLE_DETAIL_TAB) params.set("tab", tab);
  if (tab === "usage" && page !== undefined && page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query
    ? `${vehicleDetailBasePath(vehicleId)}?${query}`
    : vehicleDetailBasePath(vehicleId);
}
