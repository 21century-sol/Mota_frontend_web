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
