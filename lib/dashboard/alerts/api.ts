import type {
  AlertDto,
  AlertItem,
  AlertLocationDto,
  AlertSeverity,
} from "@/types/dashboard/alerts";
import { ALERT_SEVERITIES } from "@/types/dashboard/alerts";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Same rationale as `VehicleSummaryContractMismatchError`
 * (`lib/dashboard/summary/api.ts`, issue #11): the backend response envelope
 * (bare array vs `{ content: [...] }`) is unconfirmed, and an alert with a
 * malformed/missing field must not be silently dropped or treated as "no
 * alerts" (AC1 requires severity to be reliably distinguishable per item).
 */
export class AlertsContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Alerts response contract mismatch: ${reason}`);
    this.name = "AlertsContractMismatchError";
  }
}

export type AlertsFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

/** Fetch-stage error. Keeps the user-facing message separate from the internal cause. */
export class AlertsFetchError extends Error {
  constructor(
    public readonly kind: AlertsFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Alerts fetch failed: ${kind}`);
    this.name = "AlertsFetchError";
  }
}

function isAlertSeverity(value: unknown): value is AlertSeverity {
  return (
    typeof value === "string" &&
    (ALERT_SEVERITIES as readonly string[]).includes(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Rejects coordinates outside valid lat/lng ranges instead of rendering a broken map marker. */
function isAlertLocationDto(value: unknown): value is AlertLocationDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isFiniteNumber(candidate.lat) &&
    candidate.lat >= -90 &&
    candidate.lat <= 90 &&
    isFiniteNumber(candidate.lng) &&
    candidate.lng >= -180 &&
    candidate.lng <= 180
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isAlertDto(value: unknown): value is AlertDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.vehicleId) &&
    isNonEmptyString(candidate.vehiclePlateNumber) &&
    typeof candidate.vehicleModel === "string" &&
    typeof candidate.description === "string" &&
    isAlertSeverity(candidate.severity) &&
    isNonEmptyString(candidate.occurredAt) &&
    !Number.isNaN(Date.parse(candidate.occurredAt)) &&
    isAlertLocationDto(candidate.location)
  );
}

/**
 * Absorbs both response shapes so the envelope question does not have to be
 * settled before UI work can proceed (same pattern as `#11`'s
 * `extractDtoArray`): a bare `AlertDto[]`, or a checklist-style
 * `{ content: AlertDto[] }` envelope.
 */
function extractDtoArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === "object" && raw !== null && "content" in raw) {
    const content = (raw as Record<string, unknown>).content;
    if (Array.isArray(content)) {
      return content;
    }
  }
  throw new AlertsContractMismatchError(
    "response is neither a bare array nor an envelope with an array `content` field",
  );
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Relative-time label matching the Figma copy style ("2분 전", "30분 전", "1시간
 * 전"). `referenceTime` defaults to the real current time (this is a genuinely
 * relative label, recomputed at fetch time — issue #12 has no polling
 * requirement, PM Assumption A2), but is an explicit parameter so callers
 * (tests, `toAlertItems`) can pass a fixed instant for deterministic output
 * instead of depending on the wall clock.
 */
export function formatRelativeTime(
  occurredAtIso: string,
  referenceTime: Date = new Date(),
): string {
  // Clamp a negative gap (e.g. clock skew between client/server, or a
  // timestamp that is momentarily "in the future" relative to `referenceTime`)
  // to 0 instead of producing a nonsensical negative duration.
  const diffMs = Math.max(
    0,
    referenceTime.getTime() - Date.parse(occurredAtIso),
  );

  if (diffMs < MINUTE_MS) return "방금 전";
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}분 전`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)}시간 전`;
  return `${Math.floor(diffMs / DAY_MS)}일 전`;
}

/**
 * unknown → UI model list. A duplicate `id` or any entry failing shape/range
 * validation is treated as a contract mismatch rather than being dropped
 * silently, matching the `#11` precedent of surfacing data-integrity problems
 * instead of hiding them behind an empty/partial list.
 */
export function toAlertItems(
  raw: unknown,
  referenceTime: Date = new Date(),
): AlertItem[] {
  const dtoArray = extractDtoArray(raw);
  const seenIds = new Set<string>();
  const items: AlertItem[] = [];

  for (const entry of dtoArray) {
    if (!isAlertDto(entry)) {
      throw new AlertsContractMismatchError(
        "array entry is missing a required field, has an unknown `severity`, or has an out-of-range `location`",
      );
    }
    if (seenIds.has(entry.id)) {
      throw new AlertsContractMismatchError(`duplicate alert id: ${entry.id}`);
    }
    seenIds.add(entry.id);

    items.push({
      id: entry.id,
      vehicleId: entry.vehicleId,
      vehiclePlateNumber: entry.vehiclePlateNumber,
      description: entry.description,
      severity: entry.severity,
      occurredAtIso: entry.occurredAt,
      occurredAtLabel: formatRelativeTime(entry.occurredAt, referenceTime),
      location: entry.location,
    });
  }

  return items;
}

/**
 * MSW-only placeholder path. TODO(#12): replace with the confirmed backend
 * endpoint once the real contract lands and remove this comment.
 */
export const ALERTS_ENDPOINT_PATH = "/api/dashboard/alerts";

/**
 * Same jsdom/undici `AbortSignal` realm mismatch worked around in
 * `lib/dashboard/summary/api.ts` (issue #11) — never happens in real browsers.
 * TODO(#22): jsdom/undici AbortSignal 이중 realm — 프로덕션 무관. #22에서
 * tests/setup 정합화 후 우회 제거.
 */
function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchAlerts(signal?: AbortSignal): Promise<AlertItem[]> {
  const url = `${dashboardClientEnv.apiBase}${ALERTS_ENDPOINT_PATH}`;
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause; // Cancellation: let React Query handle it as-is.

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new AlertsFetchError(
          "network-error",
          "알림 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new AlertsFetchError(
        "network-error",
        "알림 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new AlertsFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "알림 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new AlertsFetchError(
      "malformed-response",
      "알림 정보를 해석할 수 없습니다.",
      cause,
    );
  }

  return toAlertItems(body);
}
