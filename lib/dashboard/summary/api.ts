import type {
  VehicleStatus,
  VehicleStatusCountDto,
  VehicleSummaryCounts,
} from "@/types/dashboard/summary";
import { VEHICLE_STATUSES } from "@/types/dashboard/summary";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Decision D1 (`.claude/handoffs/11-api-specs.md`) is unresolved on purpose: whether
 * the backend wraps responses in the checklist-style `{statusCode, error, content}`
 * envelope is not confirmed. This error is thrown instead of silently treating an
 * unexpected shape as empty/0 (AC3 requires 0 to be distinguishable from "no data").
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

function isVehicleStatus(value: unknown): value is VehicleStatus {
  return (
    typeof value === "string" &&
    (VEHICLE_STATUSES as readonly string[]).includes(value)
  );
}

function isVehicleStatusCountDto(
  value: unknown,
): value is VehicleStatusCountDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isVehicleStatus(candidate.status) &&
    typeof candidate.count === "number" &&
    Number.isFinite(candidate.count) &&
    candidate.count >= 0
  );
}

/**
 * Absorbs both response shapes so D1 does not need to be settled before UI work
 * can proceed:
 *  - 안 B (bare array): `VehicleStatusCountDto[]`
 *  - 안 A (checklist-style envelope): `{ statusCode, error, content: VehicleStatusCountDto[] }`
 * Only structurally checked — `lib/api.ts`'s `ApiResponse<T>` type is never imported
 * (protected file, CLAUDE.md §3).
 */
function extractDtoArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw; // 안 B
  }
  if (typeof raw === "object" && raw !== null && "content" in raw) {
    const content = (raw as Record<string, unknown>).content;
    if (Array.isArray(content)) {
      return content; // 안 A
    }
  }
  throw new VehicleSummaryContractMismatchError(
    "response is neither a bare array nor an envelope with an array `content` field",
  );
}

/**
 * unknown → UI model. A missing status falls back to 0 (an explicit, documented
 * default — not data loss). An unknown or duplicate status is treated as a
 * contract mismatch instead of being dropped silently.
 */
export function toVehicleSummaryCounts(raw: unknown): VehicleSummaryCounts {
  const dtoArray = extractDtoArray(raw);
  const counts = new Map<VehicleStatus, number>();

  for (const entry of dtoArray) {
    if (!isVehicleStatusCountDto(entry)) {
      throw new VehicleSummaryContractMismatchError(
        "array entry is missing a valid `status` enum value or non-negative `count`",
      );
    }
    if (counts.has(entry.status)) {
      throw new VehicleSummaryContractMismatchError(
        `duplicate status entry: ${entry.status}`,
      );
    }
    counts.set(entry.status, entry.count);
  }

  return {
    ownedCount: counts.get("OWNED") ?? 0,
    availableCount: counts.get("AVAILABLE") ?? 0,
    rentedCount: counts.get("RENTED") ?? 0,
    unavailableCount: counts.get("UNAVAILABLE") ?? 0,
  };
}

/**
 * MSW-only placeholder path. TODO(#11): replace with the confirmed backend
 * endpoint once the real contract lands and remove this comment.
 */
export const SUMMARY_ENDPOINT_PATH = "/api/dashboard/vehicles/summary";

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
