import type { VehicleListFilters } from "@/types/dashboard/vehicle";

/**
 * Query key factory for the `/dashboard/vehicles` list (React Query v5). No
 * `page`/`cursor` segment — the endpoint has no pagination parameters
 * (PM Decision 3, `.claude/handoffs/14-pm-breakdown.md`).
 *
 * `detail`/`alertHistory`/`usageHistory`/`tireDetail`/`tireTrend` (issue #15,
 * additive) key the `/dashboard/vehicles/[vehicleId]` screen's queries —
 * `list` above is unchanged. `currentRental` (issue #42, additive) keys the
 * separate `/current-rental` endpoint — distinct from `detail` since the two
 * are now independent queries against independent endpoints.
 *
 * `tireTrend` is keyed by `vehicleId` only — the real `getTireTrend` payload
 * returns all metrics together; the metric toggle filters client-side.
 */
export const vehiclesQueryKeys = {
  all: ["dashboard", "vehicles"] as const,
  list: (filters: VehicleListFilters) =>
    [
      ...vehiclesQueryKeys.all,
      "list",
      { status: filters.status ?? null, tireStatus: filters.tireStatus ?? null },
    ] as const,
  detail: (vehicleId: string) =>
    [...vehiclesQueryKeys.all, "detail", vehicleId] as const,
  currentRental: (vehicleId: string) =>
    [...vehiclesQueryKeys.all, "currentRental", vehicleId] as const,
  alertHistory: (vehicleId: string) =>
    [...vehiclesQueryKeys.all, "alertHistory", vehicleId] as const,
  usageHistory: (vehicleId: string, page: number) =>
    [...vehiclesQueryKeys.all, "usageHistory", vehicleId, page] as const,
  tireDetail: (vehicleId: string) =>
    [...vehiclesQueryKeys.all, "tireDetail", vehicleId] as const,
  tireTrend: (vehicleId: string) =>
    [...vehiclesQueryKeys.all, "tireTrend", vehicleId] as const,
};
