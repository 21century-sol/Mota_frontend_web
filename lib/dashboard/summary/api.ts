import type {
  DashboardSummaryContentDto,
  VehicleSummaryCounts,
} from "@/types/dashboard/summary";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Thrown for a response whose *shape* is invalid (missing/non-numeric fields).
 * Kept separate from {@link VehicleSummaryFetchError} (business-level failure:
 * `statusCode !== 200` or `error !== null` inside an otherwise well-formed
 * envelope) so a real shape bug is never silently treated as empty/0 (AC3
 * requires 0 to be distinguishable from "no data").
 */
export class VehicleSummaryContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle summary response contract mismatch: ${reason}`);
    this.name = "VehicleSummaryContractMismatchError";
  }
}

export type VehicleSummaryFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

/** Fetch-stage error. Keeps the user-facing message separate from the internal cause. */
export class VehicleSummaryFetchError extends Error {
  constructor(
    public readonly kind: VehicleSummaryFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle summary fetch failed: ${kind}`);
    this.name = "VehicleSummaryFetchError";
  }
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isDashboardSummaryContentDto(
  value: unknown,
): value is DashboardSummaryContentDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonNegativeFiniteNumber(candidate.total) &&
    isNonNegativeFiniteNumber(candidate.available) &&
    isNonNegativeFiniteNumber(candidate.rented) &&
    isNonNegativeFiniteNumber(candidate.repair)
  );
}

/**
 * unknown → UI model, per the confirmed envelope `{ statusCode, error, content }`
 * (issue #31). `statusCode !== 200` or `error !== null` is a business-level
 * failure inside an otherwise well-formed response, so it is surfaced as a
 * {@link VehicleSummaryFetchError} (same "couldn't load, retry" UX as an HTTP
 * error) rather than a {@link VehicleSummaryContractMismatchError}, which is
 * reserved for a malformed/unexpected shape.
 */
export function toVehicleSummaryCounts(raw: unknown): VehicleSummaryCounts {
  if (typeof raw !== "object" || raw === null) {
    throw new VehicleSummaryContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new VehicleSummaryContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new VehicleSummaryFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "요약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }
  if (!isDashboardSummaryContentDto(envelope.content)) {
    throw new VehicleSummaryContractMismatchError(
      "`content` is missing a non-negative finite `total`/`available`/`rented`/`repair` field",
    );
  }

  const { total, available, rented, repair } = envelope.content;
  return {
    ownedCount: total,
    availableCount: available,
    rentedCount: rented,
    unavailableCount: repair,
  };
}

/**
 * Confirmed backend endpoint (issue #31, Swagger
 * `https://mota-app.duckdns.org/swagger-ui/index.html#/Dashboard/getSummary`).
 */
export const SUMMARY_ENDPOINT_PATH = "/api/dashboard/summary";

/**
 * Some environments (notably Vitest's jsdom test environment: jsdom installs its
 * own `AbortController`/`AbortSignal` implementation, which is `instanceof
 * AbortSignal` in that realm but is a different class than the one Node's
 * fetch/undici expects) reject a technically-valid signal with a WebIDL
 * `TypeError`. This never happens in real browsers (a single realm has exactly
 * one `AbortSignal` class). Detecting that exact failure lets a real signal
 * mismatch fail loudly while this specific, narrow case degrades gracefully
 * instead of surfacing a misleading "network error" for a request that actually
 * would have succeeded.
 *
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
export async function fetchVehicleSummaryCounts(
  signal?: AbortSignal,
): Promise<VehicleSummaryCounts> {
  const url = `${dashboardClientEnv.apiBase}${SUMMARY_ENDPOINT_PATH}`;
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause; // Cancellation: let React Query handle it as-is.

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleSummaryFetchError(
          "network-error",
          "요약 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleSummaryFetchError(
        "network-error",
        "요약 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleSummaryFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "요약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleSummaryFetchError(
      "malformed-response",
      "요약 정보를 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleSummaryCounts(body);
}
