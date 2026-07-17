/**
 * DTO/UI-model types for `/dashboard/reservations` (issue #16). There is no
 * backend contract for this screen — PM confirmed the whole feature runs on
 * a local, static fixture only (`.claude/handoffs/16-pm-breakdown.md` Source
 * of Truth: "서버 데이터 없이 Figma 정적 UI(+로컬 fixture)로 구현"). Fields are
 * limited to what the issue explicitly named: 대여자명, 연락처, 차량번호, 차종,
 * 대여일, 반납일, 상태 — no speculative fields are added.
 */
export type ReservationStatus = "RENTED" | "RETURNED";

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "RENTED",
  "RETURNED",
] as const;

export function isReservationStatus(
  value: unknown,
): value is ReservationStatus {
  return (
    typeof value === "string" &&
    (RESERVATION_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * One reservation row (Figma Confirmed Design Facts,
 * `.claude/handoffs/16-figma-specs.md`). `returnedAt` is the same table
 * column ("반납일") for both statuses — an actual return date for `RETURNED`,
 * an expected return date for `RENTED` — so it is intentionally not split
 * into two differently-named fields.
 */
export interface ReservationItem {
  id: string;
  renterName: string;
  renterPhone: string;
  plateNumber: string;
  vehicleModel: string;
  /** ISO date (no time component). Rendered as `YY.MM.DD` per the confirmed Figma copy. */
  rentedAt: string;
  /** ISO date (no time component). See {@link ReservationItem} doc for RENTED vs RETURNED meaning. */
  returnedAt: string;
  status: ReservationStatus;
}

/** `status` filter; `undefined` means the "전체" tab (all statuses). */
export interface ReservationListFilters {
  status?: ReservationStatus;
}

/** 1-based page metadata for the client-side fixture pagination. */
export interface ReservationPageInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
