import {
  isTireStatus,
  isVehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import type { VehicleListFilters } from "@/types/dashboard/vehicle";

export const VEHICLES_LIST_PATH = "/dashboard/vehicles";

/**
 * Pure URL builder for the `?status=&tireStatus=` filter state (PM AC6,
 * `.claude/handoffs/14-pm-breakdown.md` Decision 4). `status`/`tireStatus`
 * are independent — omitting one from `filters` (not passing it, or passing
 * `undefined`) always drops it from the query string, so callers must pass
 * the *other* filter's current value explicitly to preserve it (e.g. changing
 * the status tab must still forward the current `tireStatus`).
 */
export function buildVehicleListHref(filters: VehicleListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tireStatus) params.set("tireStatus", filters.tireStatus);
  const query = params.toString();
  return query ? `${VEHICLES_LIST_PATH}?${query}` : VEHICLES_LIST_PATH;
}

/**
 * Server Component `searchParams` prop → typed filters. An array value (e.g.
 * a duplicated `?status=A&status=B` query) or an unrecognized enum string is
 * treated as "no filter" rather than thrown — a malformed or stale URL should
 * degrade to the "전체" tab instead of crashing the page.
 */
export function parseVehicleListFilters(
  searchParams: Record<string, string | string[] | undefined>,
): VehicleListFilters {
  const status = searchParams.status;
  const tireStatus = searchParams.tireStatus;

  return {
    status:
      typeof status === "string" && isVehicleManagementStatus(status)
        ? status
        : undefined,
    tireStatus:
      typeof tireStatus === "string" && isTireStatus(tireStatus)
        ? tireStatus
        : undefined,
  };
}
