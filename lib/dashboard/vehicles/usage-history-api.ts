import type {
  RentalHistoryItem,
  RentalHistoryPageInfo,
} from "@/types/dashboard/vehicle";
import { isRentalStatus } from "@/types/dashboard/vehicle";
import { isFiniteNumber, isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { VEHICLE_DETAIL_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/detail-api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Reserved for a genuinely malformed/unexpected response shape — a
 * well-formed envelope reporting a business failure
 * (`statusCode !== 200 || error !== null`) is a
 * {@link VehicleRentalHistoryFetchError} instead (issue #49, same 2-stage
 * split as `alert-history-api.ts`/`current-rental-api.ts`/`detail-api.ts`).
 */
export class VehicleRentalHistoryContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle rental history response contract mismatch: ${reason}`);
    this.name = "VehicleRentalHistoryContractMismatchError";
  }
}

export type VehicleRentalHistoryFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

export class VehicleRentalHistoryFetchError extends Error {
  constructor(
    public readonly kind: VehicleRentalHistoryFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle rental history fetch failed: ${kind}`);
    this.name = "VehicleRentalHistoryFetchError";
  }
}

/**
 * "YYYY.MM.DD HH:mm:ss" — KST wall-clock wire format (not ISO, no timezone
 * suffix). Locally re-defined (not imported from `alert-history-api.ts`'s own
 * module-private copy) — same local-redefinition convention followed across
 * `current-rental-api.ts`/`alert-history-api.ts` (PM handoff Assumption A5,
 * `.claude/handoffs/49-pm.md`). `status`/`startDate`/`endDate` are validated
 * but never rendered (PM Scope), matching the `alertLevel` precedent in
 * `alert-history-api.ts`.
 */
const WIRE_DATETIME_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function isWireDateTimeString(value: unknown): value is string {
  return typeof value === "string" && WIRE_DATETIME_PATTERN.test(value);
}

/**
 * Validates every confirmed `RentalHistoryItem` field. `alertCount` is
 * `null | number` (PM A4 — the Swagger type reads like a plain `int`, but the
 * display rule documents a null case, so validation stays permissive).
 * `reportDownloadUrl` is `null | string` (any string, including `""`) — the
 * UI's `reportDownloadUrl === null` check already treats an empty string as
 * "show nothing useful", so the adapter doesn't need to reject it as a
 * contract mismatch (`.claude/handoffs/49-api-specs.md` Non-blocking design
 * note).
 */
function isRentalHistoryItem(value: unknown): value is RentalHistoryItem {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.rentalId) &&
    isNonEmptyString(candidate.renterName) &&
    isNonEmptyString(candidate.contact) &&
    isRentalStatus(candidate.status) &&
    isWireDateTimeString(candidate.startDate) &&
    isWireDateTimeString(candidate.endDate) &&
    isFiniteNumber(candidate.rentalMinutes) &&
    isFiniteNumber(candidate.distanceKm) &&
    (candidate.alertCount === null || isFiniteNumber(candidate.alertCount)) &&
    (candidate.reportDownloadUrl === null ||
      typeof candidate.reportDownloadUrl === "string")
  );
}

export interface VehicleRentalHistoryResult {
  items: RentalHistoryItem[];
  pageInfo: RentalHistoryPageInfo;
}

/**
 * unknown → typed result (issue #49). Validation order matches the confirmed
 * design: HTTP-level failure is handled by the caller before this is
 * invoked; here, a business failure (`statusCode !== 200 || error !== null`)
 * is a {@link VehicleRentalHistoryFetchError}, and a malformed `content`
 * shape — not an object, `content.content` not an array, missing/non-numeric
 * page metadata, an invalid item, or a duplicate `rentalId` — is a
 * {@link VehicleRentalHistoryContractMismatchError}.
 *
 * The response envelope nests the page wrapper (`content.content` is the
 * item array, `content.page`/`size`/`totalPages`/`totalElements` are sibling
 * fields on the same `content` object) — distinct from the #15 provisional
 * single-level `content.items`/`content.pageInfo` shape this replaces.
 * `content.page` (0-based) is converted to a 1-based `pageInfo.page` (PM A1).
 */
export function toVehicleRentalHistoryResult(raw: unknown): VehicleRentalHistoryResult {
  if (typeof raw !== "object" || raw === null) {
    throw new VehicleRentalHistoryContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new VehicleRentalHistoryContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new VehicleRentalHistoryFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "이용 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }

  const outerContent = envelope.content;
  if (typeof outerContent !== "object" || outerContent === null) {
    throw new VehicleRentalHistoryContractMismatchError("`content` is not an object");
  }
  const { content, page, size, totalPages, totalElements } =
    outerContent as Record<string, unknown>;

  if (!Array.isArray(content)) {
    throw new VehicleRentalHistoryContractMismatchError(
      "`content.content` is not an array",
    );
  }
  if (
    !isFiniteNumber(page) ||
    !isFiniteNumber(size) ||
    !isFiniteNumber(totalPages) ||
    !isFiniteNumber(totalElements)
  ) {
    throw new VehicleRentalHistoryContractMismatchError(
      "`content` page metadata (page/size/totalPages/totalElements) is missing or not numeric",
    );
  }

  const seenIds = new Set<string>();
  const items: RentalHistoryItem[] = [];
  for (const entry of content) {
    if (!isRentalHistoryItem(entry)) {
      throw new VehicleRentalHistoryContractMismatchError(
        "array entry is missing a required field or has an invalid enum/date value",
      );
    }
    if (seenIds.has(entry.rentalId)) {
      throw new VehicleRentalHistoryContractMismatchError(
        `duplicate rental id: ${entry.rentalId}`,
      );
    }
    seenIds.add(entry.rentalId);
    items.push(entry);
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

/** Path suffix appended to the shared `VEHICLE_DETAIL_ENDPOINT_PATH/{vehicleId}` base (issue #49, new endpoint, replaces the #15 provisional `/usage-history` suffix). */
export const VEHICLE_RENTAL_HISTORY_ENDPOINT_PATH_SUFFIX = "/rentals";

export const VEHICLE_RENTAL_HISTORY_PAGE_SIZE = 8;

/**
 * `page` is the 1-based value used everywhere else in the app (URL, query
 * key, `RentalHistoryPageInfo`) — this is the single place that converts it
 * to the 0-based `page` query param the backend expects (PM A1).
 */
function buildVehicleRentalHistoryUrl(vehicleId: string, page: number): string {
  const params = new URLSearchParams({
    page: String(page - 1),
    size: String(VEHICLE_RENTAL_HISTORY_PAGE_SIZE),
  });
  return `${dashboardClientEnv.apiBase}${VEHICLE_DETAIL_ENDPOINT_PATH}/${vehicleId}${VEHICLE_RENTAL_HISTORY_ENDPOINT_PATH_SUFFIX}?${params.toString()}`;
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
export async function fetchVehicleRentalHistory(
  vehicleId: string,
  page: number,
  signal?: AbortSignal,
): Promise<VehicleRentalHistoryResult> {
  const url = buildVehicleRentalHistoryUrl(vehicleId, page);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleRentalHistoryFetchError(
          "network-error",
          "이용 이력을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleRentalHistoryFetchError(
        "network-error",
        "이용 이력을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleRentalHistoryFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "이용 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleRentalHistoryFetchError(
      "malformed-response",
      "이용 이력을 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleRentalHistoryResult(body);
}
