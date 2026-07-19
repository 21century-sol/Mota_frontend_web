import type {
  RentalStatusResponse,
  ReservationItem,
  ReservationListFilters,
  ReservationPageInfo,
} from "@/types/dashboard/reservation";
import { isFiniteNumber, isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Issue #51 real backend adapter for `/dashboard/reservations` ("대여 현황"),
 * replacing the local-fixture-only implementation from issue #16. Structure
 * mirrors `lib/dashboard/vehicles/usage-history-api.ts` (issue #49) exactly —
 * same 2-stage envelope validation, same error class shape, same 1-based
 * page convention — see `.claude/handoffs/51-api-specs.md`.
 */

/**
 * Reserved for a genuinely malformed/unexpected response shape — a
 * well-formed envelope reporting a business failure
 * (`statusCode !== 200 || error !== null`) is a
 * {@link ReservationListFetchError} instead (same 2-stage split as
 * `usage-history-api.ts`).
 */
export class ReservationListContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Reservation list response contract mismatch: ${reason}`);
    this.name = "ReservationListContractMismatchError";
  }
}

export type ReservationListFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

export class ReservationListFetchError extends Error {
  constructor(
    public readonly kind: ReservationListFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Reservation list fetch failed: ${kind}`);
    this.name = "ReservationListFetchError";
  }
}

/**
 * The API's own `status` enum has 3 values — distinct from the 2-value UI
 * `isReservationStatus` (`types/dashboard/reservation.ts`), which only ever
 * describes the mapped `ReservationItem.status`. Kept local to this module
 * (not exported to the types file) since it only matters for validating the
 * raw wire DTO.
 */
type ReservationApiStatus = RentalStatusResponse["status"];

const RESERVATION_API_STATUSES: readonly ReservationApiStatus[] = [
  "RESERVED",
  "IN_PROGRESS",
  "RETURNED",
];

function isReservationApiStatus(value: unknown): value is ReservationApiStatus {
  return (
    typeof value === "string" &&
    (RESERVATION_API_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Matches a date-only `startDate`/`endDate` wire value in the canonical
 * `YYYY-MM-DD` format, tolerating the dot-separated `YYYY.MM.DD` variant the
 * live backend currently emits (both differ from the OpenAPI schema's declared
 * `date-time`). The regex pins the exact shape (so a stray ISO date-time is
 * rejected as a contract mismatch), and the `Date.parse` guard on the
 * normalized (dashed) form rejects impossible calendar dates like `2026-13-40`.
 */
function isWireDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}[.-]\d{2}[.-]\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(normalizeWireDateToIsoDate(value)))
  );
}

/**
 * Validates every confirmed `RentalStatusResponse` field. `startDate`/
 * `endDate` are date-only wire values (`YYYY-MM-DD`, dot-variant tolerated —
 * see {@link isWireDateString}), not the OpenAPI `date-time`.
 * `reportDownloadUrl` is `null` when no report exists (live backend), so both
 * `null` and a plain string (including `""`) are accepted.
 */
function isRentalStatusResponse(value: unknown): value is RentalStatusResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.rentalId) &&
    isNonEmptyString(candidate.renterName) &&
    isNonEmptyString(candidate.contact) &&
    isNonEmptyString(candidate.manufacturer) &&
    isNonEmptyString(candidate.model) &&
    isNonEmptyString(candidate.plateNumber) &&
    isWireDateString(candidate.startDate) &&
    isWireDateString(candidate.endDate) &&
    isReservationApiStatus(candidate.status) &&
    (candidate.reportDownloadUrl === null ||
      typeof candidate.reportDownloadUrl === "string")
  );
}

/**
 * Normalizes a date-only wire value to the canonical `YYYY-MM-DD` (dashed)
 * form by literal separator replacement only — a `YYYY-MM-DD` input is
 * returned unchanged, a dot-separated `YYYY.MM.DD` is converted. Deliberately
 * avoids `new Date(...)`: a dotted date parses as local midnight, so a UTC
 * round-trip would shift the day backwards in `UTC+` zones (e.g. KST).
 * `formatReservationDateLabel` then reads the dashed value via UTC getters and
 * renders it identically regardless of timezone.
 */
function normalizeWireDateToIsoDate(wire: string): string {
  return wire.replace(/\./g, "-");
}

/**
 * IN_PROGRESS→RENTED, RETURNED→RETURNED (PM Decision 1,
 * `.claude/handoffs/51-pm.md`). `RESERVED` is never passed here — filtered
 * out by the caller before mapping.
 */
function toReservationItem(entry: RentalStatusResponse): ReservationItem {
  return {
    id: entry.rentalId,
    renterName: entry.renterName,
    renterPhone: entry.contact,
    plateNumber: entry.plateNumber,
    vehicleModel: `${entry.manufacturer} ${entry.model}`,
    rentedAt: normalizeWireDateToIsoDate(entry.startDate),
    returnedAt: normalizeWireDateToIsoDate(entry.endDate),
    status: entry.status === "IN_PROGRESS" ? "RENTED" : "RETURNED",
    reportDownloadUrl: entry.reportDownloadUrl,
  };
}

export interface ReservationListResult {
  items: ReservationItem[];
  pageInfo: ReservationPageInfo;
}

/**
 * unknown → typed result (issue #51). Validation order mirrors
 * `toVehicleRentalHistoryResult` exactly: a business failure
 * (`statusCode !== 200 || error !== null`) is a
 * {@link ReservationListFetchError}; a malformed `content` shape — not an
 * object, `content.content` not an array, missing/non-numeric page metadata,
 * an invalid item, or a duplicate `rentalId` — is a
 * {@link ReservationListContractMismatchError}.
 *
 * A `RESERVED` row is defensively dropped (not thrown) after passing shape
 * validation and the duplicate-id check — the confirmed base query never
 * requests `status=RESERVED` in the first place (PM Decision 1), so this only
 * guards against an unexpected server-side inclusion. `content.page`
 * (0-based) is converted to a 1-based `pageInfo.page`.
 */
export function toReservationListResult(raw: unknown): ReservationListResult {
  if (typeof raw !== "object" || raw === null) {
    throw new ReservationListContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new ReservationListContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new ReservationListFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "대여 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }

  const outerContent = envelope.content;
  if (typeof outerContent !== "object" || outerContent === null) {
    throw new ReservationListContractMismatchError("`content` is not an object");
  }
  const { content, page, size, totalPages, totalElements } =
    outerContent as Record<string, unknown>;

  if (!Array.isArray(content)) {
    throw new ReservationListContractMismatchError(
      "`content.content` is not an array",
    );
  }
  if (
    !isFiniteNumber(page) ||
    !isFiniteNumber(size) ||
    !isFiniteNumber(totalPages) ||
    !isFiniteNumber(totalElements)
  ) {
    throw new ReservationListContractMismatchError(
      "`content` page metadata (page/size/totalPages/totalElements) is missing or not numeric",
    );
  }

  const seenIds = new Set<string>();
  const items: ReservationItem[] = [];
  for (const entry of content) {
    if (!isRentalStatusResponse(entry)) {
      throw new ReservationListContractMismatchError(
        "array entry is missing a required field or has an invalid enum/date value",
      );
    }
    if (seenIds.has(entry.rentalId)) {
      throw new ReservationListContractMismatchError(
        `duplicate rental id: ${entry.rentalId}`,
      );
    }
    seenIds.add(entry.rentalId);

    if (entry.status === "RESERVED") continue;
    items.push(toReservationItem(entry));
  }

  return {
    items,
    pageInfo: {
      page: page + 1,
      pageSize: size,
      totalCount: totalElements,
      totalPages,
    },
  };
}

/** Confirmed backend endpoint (issue #51, operationId `getRentalStatusList`). */
export const RESERVATION_STATUS_ENDPOINT_PATH = "/api/dashboard/rentals";

export const RESERVATION_STATUS_PAGE_SIZE = 8;

/**
 * `page` is the 1-based value used everywhere else in the app (URL, query
 * key, `ReservationPageInfo`) — this is the single place that converts it to
 * the 0-based `page` query param the backend expects (PM Decision 5). `sort`
 * is never sent (PM Decision 3, non-goal: no sort UI/param).
 */
function buildReservationListUrl(
  filters: ReservationListFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status === "RENTED" ? "IN_PROGRESS" : "RETURNED");
  }
  if (filters.rentedOn) {
    params.set("rentedFrom", filters.rentedOn);
    params.set("rentedTo", filters.rentedOn);
  }
  if (filters.returnedOn) {
    params.set("returnedFrom", filters.returnedOn);
    params.set("returnedTo", filters.returnedOn);
  }
  params.set("page", String(page - 1));
  params.set("size", String(RESERVATION_STATUS_PAGE_SIZE));
  return `${dashboardClientEnv.apiBase}${RESERVATION_STATUS_ENDPOINT_PATH}?${params.toString()}`;
}

/**
 * Same jsdom/undici `AbortSignal` realm mismatch worked around across
 * `lib/dashboard/vehicles/*.ts` — never happens in real browsers.
 * TODO(#22): jsdom/undici AbortSignal 이중 realm — 프로덕션 무관.
 */
function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. `page` is 1-based; forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchReservations(
  filters: ReservationListFilters,
  page: number,
  signal?: AbortSignal,
): Promise<ReservationListResult> {
  const url = buildReservationListUrl(filters, page);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new ReservationListFetchError(
          "network-error",
          "대여 현황을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new ReservationListFetchError(
        "network-error",
        "대여 현황을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new ReservationListFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "대여 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ReservationListFetchError(
      "malformed-response",
      "대여 현황을 해석할 수 없습니다.",
      cause,
    );
  }

  return toReservationListResult(body);
}
