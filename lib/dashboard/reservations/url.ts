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
  /** `YYYY-MM-DD`, from the "대여일" calendar popover (issue #29, AC8). */
  rentedOn: string | undefined;
  /** `YYYY-MM-DD`, from the "반납일" calendar popover (issue #29, AC8). */
  returnedOn: string | undefined;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** An unrecognized/duplicated `status` or a non-positive/non-integer `page` degrades to the default instead of throwing (AC5). Same degrade-instead-of-throw treatment applies to a malformed `rentedOn`/`returnedOn` (issue #29). */
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
    rentedOn: parseReservationIsoDate(searchParams.rentedOn),
    returnedOn: parseReservationIsoDate(searchParams.returnedOn),
  };
}

function parseReservationPage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseReservationIsoDate(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && ISO_DATE_PATTERN.test(value) ? value : undefined;
}

/**
 * `status`/`rentedOn`/`returnedOn` are omitted when unset; `page` is omitted
 * at page 1. A tab click or date selection always passes a fresh `page` (or
 * omits it), never the caller's previous page, so switching tabs/dates
 * naturally resets pagination to page 1 (AC4/AC8) without extra reset logic
 * at the call site. Calling with `{}` therefore also fully resets the filter
 * (status + page + date range), which `ReservationUpdateBar`'s reset button
 * relies on (AC10).
 */
export function buildReservationListHref(params: {
  status?: ReservationStatus;
  page?: number;
  rentedOn?: string;
  returnedOn?: string;
}): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page !== undefined && params.page > 1) {
    search.set("page", String(params.page));
  }
  if (params.rentedOn) search.set("rentedOn", params.rentedOn);
  if (params.returnedOn) search.set("returnedOn", params.returnedOn);
  const query = search.toString();
  return query ? `${RESERVATIONS_LIST_PATH}?${query}` : RESERVATIONS_LIST_PATH;
}
