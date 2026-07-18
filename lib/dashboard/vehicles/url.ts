import {
  isTireStatus,
  isVehicleManagementStatus,
  TIRE_STATUSES,
} from "@/types/dashboard/vehicle";
import type { TireStatus, VehicleListFilters } from "@/types/dashboard/vehicle";

export const VEHICLES_LIST_PATH = "/dashboard/vehicles";

/**
 * Sorts a (possibly click-ordered, possibly duplicated) tire status selection
 * into the canonical `NORMAL,CAUTION,WARNING` order (issue #35 AC4/PM
 * Assumption A1) — the URL, and any cache key derived from it, must not
 * depend on the order the user clicked the chips in. Also de-duplicates,
 * since membership (not position) is what's being encoded.
 */
function canonicalizeTireStatuses(
  values: readonly TireStatus[],
): TireStatus[] {
  return TIRE_STATUSES.filter((status) => values.includes(status));
}

/**
 * Pure URL builder for the `?status=&tireStatus=` filter state (PM AC6,
 * `.claude/handoffs/14-pm-breakdown.md` Decision 4). `status`/`tireStatus`
 * are independent — omitting one from `filters` (not passing it, or passing
 * `undefined`/`[]`) always drops it from the query string, so callers must
 * pass the *other* filter's current value explicitly to preserve it (e.g.
 * changing the status tab must still forward the current `tireStatus`).
 *
 * `tireStatus` (issue #35) is multi-value, serialized as a single
 * comma-joined `tireStatus` query param in canonical order (e.g.
 * `?tireStatus=CAUTION,WARNING`) rather than a repeated key — there is no
 * existing repo precedent for repeated-key array params (PM Assumption A1).
 * An empty array omits the param entirely.
 */
export function buildVehicleListHref(filters: VehicleListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);

  const tireStatus = canonicalizeTireStatuses(filters.tireStatus);
  if (tireStatus.length > 0) params.set("tireStatus", tireStatus.join(","));

  /**
   * `URLSearchParams#toString()` percent-encodes `,` as `%2C`, but a comma is
   * a legal unescaped character in a URI query component (RFC 3986 sub-delims)
   * and AC4/the confirmed multi-value contract expect a literal
   * `?tireStatus=CAUTION,WARNING` (bug found during test-agent verification,
   * issue #35 — `%2C` broke both the pre-existing url/filter-bar round-trip
   * tests). Un-escaping only this one sequence back to `,` is safe here since
   * `status`/`tireStatus` are both closed enum tokens that never contain a
   * literal `%2C` substring themselves.
   */
  const query = params.toString().replace(/%2C/g, ",");
  return query ? `${VEHICLES_LIST_PATH}?${query}` : VEHICLES_LIST_PATH;
}

/**
 * Server Component `searchParams` prop → typed filters. An array value (e.g.
 * a duplicated `?status=A&status=B` query) or an unrecognized enum string is
 * treated as "no filter" rather than thrown — a malformed or stale URL should
 * degrade to the "전체" tab instead of crashing the page.
 *
 * `tireStatus` (issue #35) is parsed as a comma-joined list and canonicalized
 * back into `NORMAL,CAUTION,WARNING` order. Any single unparseable/unknown
 * token degrades the *whole* `tireStatus` filter to `[]`, matching the
 * existing malformed-`status`-degrades-to-`undefined` precedent below (PM
 * Assumption A2) — a partially-valid selection is not partially recovered,
 * since there is no way to tell which token the user actually intended.
 */
export function parseVehicleListFilters(
  searchParams: Record<string, string | string[] | undefined>,
): VehicleListFilters {
  const status = searchParams.status;
  const tireStatusRaw = searchParams.tireStatus;

  let tireStatus: TireStatus[] = [];
  if (typeof tireStatusRaw === "string" && tireStatusRaw.length > 0) {
    const tokens = tireStatusRaw.split(",");
    if (tokens.every(isTireStatus)) {
      tireStatus = canonicalizeTireStatuses(tokens);
    }
  }

  return {
    status:
      typeof status === "string" && isVehicleManagementStatus(status)
        ? status
        : undefined,
    tireStatus,
  };
}
