import type { TireTrendMetric, TireTrendPoint } from "@/types/dashboard/vehicle";
import { isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * TODO(#15): provisional envelope — see `types/dashboard/vehicle.ts`
 * "Issue #15" section header.
 */
export class VehicleTireTrendContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle tire trend response contract mismatch: ${reason}`);
    this.name = "VehicleTireTrendContractMismatchError";
  }
}

export type VehicleTireTrendFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

export class VehicleTireTrendFetchError extends Error {
  constructor(
    public readonly kind: VehicleTireTrendFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle tire trend fetch failed: ${kind}`);
    this.name = "VehicleTireTrendFetchError";
  }
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isTireTrendPoint(value: unknown): value is TireTrendPoint {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.date) &&
    !Number.isNaN(Date.parse(candidate.date)) &&
    isNullableNumber(candidate.fl) &&
    isNullableNumber(candidate.fr) &&
    isNullableNumber(candidate.rl) &&
    isNullableNumber(candidate.rr)
  );
}

/** unknown → UI model list (PM AC18). An invalid point is a contract mismatch, not a dropped data point. */
export function toVehicleTireTrendPoints(raw: unknown): TireTrendPoint[] {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleTireTrendContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null || !("points" in content)) {
    throw new VehicleTireTrendContractMismatchError("`content` is missing the `points` field");
  }
  const points = (content as Record<string, unknown>).points;
  if (!Array.isArray(points)) {
    throw new VehicleTireTrendContractMismatchError("`content.points` is not an array");
  }

  const items: TireTrendPoint[] = [];
  for (const entry of points) {
    if (!isTireTrendPoint(entry)) {
      throw new VehicleTireTrendContractMismatchError(
        "array entry is missing a required field or has an invalid type",
      );
    }
    items.push(entry);
  }
  return items;
}

function buildVehicleTireTrendUrl(vehicleId: string, metric: TireTrendMetric): string {
  const params = new URLSearchParams({ metric });
  return `${dashboardClientEnv.apiBase}/api/dashboard/vehicles/${vehicleId}/tires/trend?${params.toString()}`;
}

function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchVehicleTireTrend(
  vehicleId: string,
  metric: TireTrendMetric,
  signal?: AbortSignal,
): Promise<TireTrendPoint[]> {
  const url = buildVehicleTireTrendUrl(vehicleId, metric);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleTireTrendFetchError(
          "network-error",
          "타이어 상태 추이를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleTireTrendFetchError(
        "network-error",
        "타이어 상태 추이를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleTireTrendFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "타이어 상태 추이를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleTireTrendFetchError(
      "malformed-response",
      "타이어 상태 추이를 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleTireTrendPoints(body);
}
