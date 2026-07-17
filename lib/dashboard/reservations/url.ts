import { isReservationStatus } from "@/types/dashboard/reservation";
import type { ReservationStatus } from "@/types/dashboard/reservation";

/**
 * Pure URL build/parse functions for the `?status=&page=` state
 * (`.claude/handoffs/16-pm-breakdown.md` AC2/AC3/AC4/AC5), following the same
 * precedent as `lib/dashboard/vehicles/url.ts` (#14) and
 * `lib/dashboard/vehicles/tab-url.ts` (#15): the Server Component page reads
 * `searchParams` and passes typed props down; only click handlers build the
 * next href, and the default state (전체 tab / page 1) is always omitted from
 * the query string.
 */
export const RESERVATIONS_LIST_PATH = "/dashboard/reservations";

export interface ReservationListParams {
  status: ReservationStatus | undefined;
  page: number;
}

/** An unrecognized/duplicated `status` or a non-positive/non-integer `page` degrades to the default instead of throwing (AC5). */
export function parseReservationListParams(
  searchParams: Record<string, string | string[] | undefined>,
): ReservationListParams {
  const status = searchParams.status;

  return {
    status:
      typeof status === "string" && isReservationStatus(status)
        ? status
        : undefined,
    page: parseReservationPage(searchParams.page),
  };
}

function parseReservationPage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * `status` is omitted for the "전체" tab; `page` is omitted at page 1. A tab
 * click always passes a fresh `page` (or omits it), never the caller's
 * previous page, so switching tabs naturally resets pagination to page 1
 * (AC4) without extra reset logic at the call site.
 */
export function buildReservationListHref(params: {
  status?: ReservationStatus;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page !== undefined && params.page > 1) {
    search.set("page", String(params.page));
  }
  const query = search.toString();
  return query ? `${RESERVATIONS_LIST_PATH}?${query}` : RESERVATIONS_LIST_PATH;
}
