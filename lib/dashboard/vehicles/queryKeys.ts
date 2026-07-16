import type { VehicleListFilters } from "@/types/dashboard/vehicle";

/**
 * Query key factory for the `/dashboard/vehicles` list (React Query v5). No
 * `page`/`cursor` segment — the endpoint has no pagination parameters
 * (PM Decision 3, `.claude/handoffs/14-pm-breakdown.md`).
 */
export const vehiclesQueryKeys = {
  all: ["dashboard", "vehicles"] as const,
  list: (filters: VehicleListFilters) =>
    [
      ...vehiclesQueryKeys.all,
      "list",
      { status: filters.status ?? null, tireStatus: filters.tireStatus ?? null },
    ] as const,
};
