import type { CurrentRental } from "@/types/dashboard/vehicle";
import { isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { VEHICLE_DETAIL_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/detail-api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Reserved for a genuinely malformed/unexpected response shape — a
 * well-formed envelope reporting a business failure
 * (`statusCode !== 200 || error !== null`) is a {@link CurrentRentalFetchError}
 * instead (issue #42, same split as `detail-api.ts`).
 */
export class CurrentRentalContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Current rental response contract mismatch: ${reason}`);
    this.name = "CurrentRentalContractMismatchError";
  }
}

export type CurrentRentalFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

/**
 * Fetch/business-failure error. Unlike `VehicleDetailFetchError`, there is no
 * dedicated `"not-found"` kind — the confirmed contract does not document a
 * 404 case for this endpoint, so any 4xx (including a hypothetical 404)
 * surfaces as the generic `"client-error"` (PM/API handoff non-blocking
 * note, `.claude/handoffs/42-api-specs.md` "Non-blocking Design Notes").
 */
export class CurrentRentalFetchError extends Error {
  constructor(
    public readonly kind: CurrentRentalFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Current rental fetch failed: ${kind}`);
    this.name = "CurrentRentalFetchError";
  }
}

/** "YYYY.MM.DD HH:mm:ss" — KST wall-clock wire format (not ISO, no timezone suffix). */
const WIRE_DATETIME_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function isWireDateTimeString(value: unknown): value is string {
  return typeof value === "string" && WIRE_DATETIME_PATTERN.test(value);
}

/** Validates the `CurrentRental` discriminated union — `rented: false` needs no other fields. */
export function isCurrentRentalDto(value: unknown): value is CurrentRental {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  if (typeof candidate.rented !== "boolean") return false;
  if (!candidate.rented) return true;

  return (
    isNonEmptyString(candidate.renterName) &&
    isWireDateTimeString(candidate.startDate) &&
    isWireDateTimeString(candidate.endDate)
  );
}

/**
 * unknown → typed `CurrentRental`. Same 2-stage envelope pattern as
 * `detail-api.ts` `toVehicleDetailDto`: a business failure
 * (`statusCode !== 200 || error !== null`) is a {@link CurrentRentalFetchError},
 * a malformed `content` shape is a {@link CurrentRentalContractMismatchError}.
 */
export function toCurrentRentalResult(raw: unknown): CurrentRental {
  if (typeof raw !== "object" || raw === null) {
    throw new CurrentRentalContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new CurrentRentalContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new CurrentRentalFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "예약 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }

  const content = envelope.content;
  if (!isCurrentRentalDto(content)) {
    throw new CurrentRentalContractMismatchError(
      "`content` is not a valid CurrentRental shape",
    );
  }

  return content;
}

/** Path suffix appended to the shared `VEHICLE_DETAIL_ENDPOINT_PATH/{vehicleId}` base (issue #42, new endpoint). */
export const VEHICLE_CURRENT_RENTAL_ENDPOINT_PATH_SUFFIX = "/current-rental";

export function buildCurrentRentalUrl(vehicleId: string): string {
  return `${dashboardClientEnv.apiBase}${VEHICLE_DETAIL_ENDPOINT_PATH}/${vehicleId}${VEHICLE_CURRENT_RENTAL_ENDPOINT_PATH_SUFFIX}`;
}

/**
 * Same jsdom/undici `AbortSignal` realm mismatch worked around across
 * `lib/dashboard/vehicles/api.ts` et al. — never happens in real browsers.
 * TODO(#22): jsdom/undici AbortSignal 이중 realm — 프로덕션 무관.
 */
function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchCurrentRental(
  vehicleId: string,
  signal?: AbortSignal,
): Promise<CurrentRental> {
  const url = buildCurrentRentalUrl(vehicleId);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new CurrentRentalFetchError(
          "network-error",
          "예약 내역을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new CurrentRentalFetchError(
        "network-error",
        "예약 내역을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new CurrentRentalFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "예약 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new CurrentRentalFetchError(
      "malformed-response",
      "예약 내역을 해석할 수 없습니다.",
      cause,
    );
  }

  return toCurrentRentalResult(body);
}

// ---------------------------------------------------------------------------
// Pure date/label helpers (issue #42 Time calculation requirements).
// ---------------------------------------------------------------------------

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Last day-of-month for a 1-based `month` (1-12), leap-year aware. */
function daysInMonth(year: number, month: number): number {
  // `Date.UTC(year, month, 0)` — passing the 1-based `month` directly as the
  // (0-based) month index for `day 0` lands on the last day of the *previous*
  // (0-based) month, which is exactly the target 1-based `month`.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

/**
 * Parses a `"YYYY.MM.DD HH:mm:ss"` KST wall-clock wire string (issue #42
 * confirmed contract — not ISO, no timezone suffix) into a `Date`. The string
 * is decomposed with an explicit regex and the instant is constructed via a
 * fixed UTC-9h offset — `new Date(wireValue)` is never used directly, since
 * parsing a non-ISO, non-timezone string that way is JS-engine-dependent.
 * Throws {@link CurrentRentalContractMismatchError} for a format mismatch or
 * an out-of-range date/time component (never silently normalizes).
 */
export function parseKstDateTime(wireValue: string): Date {
  const match = WIRE_DATETIME_PATTERN.exec(wireValue);
  if (!match) {
    throw new CurrentRentalContractMismatchError(
      `date value "${wireValue}" does not match the "YYYY.MM.DD HH:mm:ss" wire format`,
    );
  }

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const second = Number(secondStr);

  if (
    !isValidCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new CurrentRentalContractMismatchError(
      `date value "${wireValue}" has an out-of-range date/time component`,
    );
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - KST_OFFSET_MS);
}

/**
 * `"YYYY.MM.DD HH:mm:ss"` wire string → `"YYYY.MM.DD"` display label. Slices
 * the already-validated date prefix directly instead of round-tripping
 * through {@link parseKstDateTime} + UTC getters, which would apply the KST
 * offset and could show a calendar date different from the wire value's
 * (PM display rule: 대여일/반납일 `YYYY.MM.DD`).
 */
export function formatKstWireDateLabel(wireValue: string): string {
  const match = WIRE_DATETIME_PATTERN.exec(wireValue);
  if (!match) {
    throw new CurrentRentalContractMismatchError(
      `date value "${wireValue}" does not match the "YYYY.MM.DD HH:mm:ss" wire format`,
    );
  }
  const [, year, month, day] = match;
  return `${year}.${month}.${day}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Exact copy expected by `ReservationSummaryCard`'s overdue color branch — kept as a named constant instead of a duplicated literal. */
export const OVERDUE_REMAINING_LABEL = "반납 예정 시간이 지났습니다";

/**
 * Pure — `now` is always an explicit parameter, `new Date()` is never called
 * internally, so tests can inject a fixed instant and the render-time caller
 * (`ReservationSummaryCard`) controls when "now" is created (PM Scope
 * "new Date() 직접 호출 금지").
 *
 * `diffMs <= 0` → overdue, `diffMs >= 24h` → "N일 남았습니다" (ceil),
 * `1h <= diffMs < 24h` → "H시간 남았습니다" (ceil),
 * `0 < diffMs < 1h` → "M분 남았습니다" (ceil).
 *
 * Non-blocking note (`.claude/handoffs/42-api-specs.md`): the `ceil` rounding
 * means a remainder of e.g. 23:59:59 still reads as "1일" only once it
 * crosses below 24h — an instant just under 24h can display "24시간" rather
 * than "1일 미만"; this rounding-boundary display artifact is accepted as-is
 * per the PM/API handoff (non-blocking, PM Assumption A2 tracks the copy).
 */
export function computeRemainingLabel(endDate: Date, now: Date): string {
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) return OVERDUE_REMAINING_LABEL;
  if (diffMs >= DAY_MS) return `반납까지 ${Math.ceil(diffMs / DAY_MS)}일 남았습니다`;
  if (diffMs >= HOUR_MS) return `반납까지 ${Math.ceil(diffMs / HOUR_MS)}시간 남았습니다`;
  return `반납까지 ${Math.ceil(diffMs / MINUTE_MS)}분 남았습니다`;
}
