import type {
  ReservationItem,
  ReservationPageInfo,
  ReservationStatus,
} from "@/types/dashboard/reservation";

/** PM Safe Assumption A1 (`.claude/handoffs/16-pm-breakdown.md`) — 8 rows/page, following the `UsageHistoryTab` (#15) precedent. */
export const RESERVATIONS_PAGE_SIZE = 8;

/**
 * Pure client-side filter over the static fixture — `status` is `undefined`
 * for the "전체" tab (no filtering). Never mutates the input array.
 */
export function filterReservationsByStatus(
  items: readonly ReservationItem[],
  status: ReservationStatus | undefined,
): ReservationItem[] {
  return status ? items.filter((item) => item.status === status) : [...items];
}

/**
 * Pure client-side date filter (issue #29, PM AC8). The calendar popover
 * picks a single day, not a range, so this is an exact-match filter against
 * `rentedAt`/`returnedAt` (both `YYYY-MM-DD`) rather than a `>=`/`<=` range
 * comparison — a Safe Assumption recorded in
 * `.claude/handoffs/29-pm-breakdown.md` Safe Assumptions, since the UI only
 * ever produces one selected date per field. When both `rentedOn` and
 * `returnedOn` are set, both conditions apply (AND, per AC8).
 */
export function filterReservationsByDateRange(
  items: readonly ReservationItem[],
  rentedOn: string | undefined,
  returnedOn: string | undefined,
): ReservationItem[] {
  return items.filter((item) => {
    if (rentedOn && item.rentedAt !== rentedOn) return false;
    if (returnedOn && item.returnedAt !== returnedOn) return false;
    return true;
  });
}

/**
 * Pure client-side pagination (1-based `page`) over an already-filtered
 * list. `totalPages` is always at least 1 so an empty result still reports a
 * valid page count instead of 0.
 */
export function paginateReservations(
  items: readonly ReservationItem[],
  page: number,
  pageSize: number = RESERVATIONS_PAGE_SIZE,
): { items: ReservationItem[]; pageInfo: ReservationPageInfo } {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pageInfo: { page, pageSize, totalCount, totalPages },
  };
}
