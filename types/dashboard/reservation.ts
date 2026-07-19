/**
 * UI-model types for `/dashboard/reservations` (issue #16). Since issue #51
 * the screen is backed by the real `GET /api/dashboard/rentals` contract (see
 * the `RentalStatusResponse`/`RentalStatusPageResponse`/
 * `ApiResponseRentalStatusPageResponse` DTOs further down this file) — these
 * UI-model types are the transformed shape `lib/dashboard/reservations/api.ts`
 * produces, not a fixture-only shape. Fields are limited to what the issue
 * explicitly named: 대여자명, 연락처, 차량번호, 차종, 대여일, 반납일, 상태 — no
 * speculative fields are added.
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
 *
 * `reportDownloadUrl` (issue #51, additive) is sourced 1:1 from
 * `RentalStatusResponse.reportDownloadUrl`. The live backend returns `null`
 * when no report exists (e.g. all `IN_PROGRESS` rows, and `RETURNED` rows
 * whose report has not been generated yet) — differing from the OpenAPI spec,
 * which typed it as a plain string. `ReservationTable`'s "PDF" button
 * (rendered for `RETURNED` rows only, existing markup unchanged) opens it and
 * no-ops when it is `null`/empty.
 */
export interface ReservationItem {
  id: string;
  renterName: string;
  renterPhone: string;
  plateNumber: string;
  vehicleModel: string;
  /** ISO date `YYYY-MM-DD` (no time component). Rendered as `YY.MM.DD` per the confirmed Figma copy. */
  rentedAt: string;
  /** ISO date `YYYY-MM-DD` (no time component). See {@link ReservationItem} doc for RENTED vs RETURNED meaning. */
  returnedAt: string;
  status: ReservationStatus;
  reportDownloadUrl: string | null;
}

/**
 * `status` filter; `undefined` means the "전체" tab (all statuses).
 * `rentedOn`/`returnedOn` (issue #29, `YYYY-MM-DD`) are exact-day matches
 * from the calendar popover — since issue #51 these are forwarded as
 * `rentedFrom=rentedTo=rentedOn`/`returnedFrom=returnedTo=returnedOn` query
 * params to the real backend (`lib/dashboard/reservations/api.ts`) instead of
 * being applied as a client-side array filter.
 */
export interface ReservationListFilters {
  status?: ReservationStatus;
  rentedOn?: string;
  returnedOn?: string;
}

/** 1-based page metadata, converted from the real API's 0-based `page` (issue #51, `lib/dashboard/reservations/api.ts`). */
export interface ReservationPageInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Issue #51 — `GET /api/dashboard/rentals` (operationId: getRentalStatusList)
// DTOs. Names mirror the OpenAPI schema names directly (`RentalStatusResponse`,
// `RentalStatusPageResponse`, `ApiResponseRentalStatusPageResponse`) so the
// wire contract stays traceable from the type name — same envelope-naming
// convention as `VehicleRentalHistoryResponse` (issue #49,
// `types/dashboard/vehicle.ts`), just spelled out as 3 nested interfaces
// instead of 1 to match the schema's own component names.
//
// The API's own `status` enum has 3 values (RESERVED/IN_PROGRESS/RETURNED) —
// distinct from the 2-value UI {@link ReservationStatus} above. `RESERVED`
// never reaches a {@link ReservationItem}: the base query never requests it
// (the "전체" tab omits `status` server-side filtering is unconfirmed either
// way), and any `RESERVED` row that does come back is defensively dropped in
// `lib/dashboard/reservations/api.ts` (`.claude/handoffs/51-api-specs.md`
// Response mapping, PM Decision 1).
// ---------------------------------------------------------------------------

/** One row from `GET /api/dashboard/rentals` (issue #51 confirmed contract). */
export interface RentalStatusResponse {
  rentalId: string;
  renterName: string;
  contact: string;
  manufacturer: string;
  model: string;
  plateNumber: string;
  /**
   * Date-only wire value in `YYYY-MM-DD` format (the adapter also tolerates the
   * dot-separated `YYYY.MM.DD` variant the live backend currently emits) —
   * this differs from the OpenAPI schema, which declares it a `date-time`. The
   * adapter (`lib/dashboard/reservations/api.ts`) normalizes it to a dashed
   * `YYYY-MM-DD` `ReservationItem.rentedAt` without ever passing it through
   * `new Date()` (a dotted date parses as local time and would shift a day in
   * non-UTC zones).
   */
  startDate: string;
  /** Date-only wire value `YYYY-MM-DD` (dot-variant tolerated). See {@link RentalStatusResponse.startDate}. */
  endDate: string;
  status: "RESERVED" | "IN_PROGRESS" | "RETURNED";
  /** Report URL, or `null` when no report exists (live backend differs from the OpenAPI `string` type). */
  reportDownloadUrl: string | null;
}

/**
 * Nested page wrapper — `content` is the item array, page metadata
 * (`page`/`size`/`totalPages`/`totalElements`) are sibling fields on the same
 * object (same nesting convention as `VehicleRentalHistoryResponse.content`,
 * issue #49). `page` is 0-based.
 */
export interface RentalStatusPageResponse {
  content: RentalStatusResponse[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

/** `{statusCode, error, content}` envelope (issue #51 confirmed contract). */
export interface ApiResponseRentalStatusPageResponse {
  statusCode: number;
  error: string | null;
  content: RentalStatusPageResponse;
}
