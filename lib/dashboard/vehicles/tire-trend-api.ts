import type {
  TireTrendDailyPoint,
  TireTrendMetric,
  TireTrendPoint,
  TireTrendSeriesKey,
  TireTrendTire,
  WheelPosition,
} from "@/types/dashboard/vehicle";
import { isWheelPosition, TIRE_TREND_METRIC_SERIES } from "@/types/dashboard/vehicle";
import { isFiniteNumber, isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/** Confirmed OpenAPI default window for the tire-trend chart (Figma 7-day axis). */
export const TIRE_TREND_GRAPH_DAYS = 7;

export const VEHICLE_TIRE_TREND_ENDPOINT_PATH = "/api/vehicles";

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

const YMD_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isYmdDateString(value: unknown): value is string {
  return typeof value === "string" && YMD_DATE_PATTERN.test(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isTireTrendDailyPoint(value: unknown): value is TireTrendDailyPoint {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isYmdDateString(candidate.date) && isNullableNumber(candidate.value);
}

function isDailyPointArray(value: unknown): value is TireTrendDailyPoint[] {
  return Array.isArray(value) && value.every(isTireTrendDailyPoint);
}

function isTireTrendTire(value: unknown): value is TireTrendTire {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.tireId) &&
    isWheelPosition(candidate.position) &&
    isDailyPointArray(candidate.pressure) &&
    isDailyPointArray(candidate.temperature) &&
    isDailyPointArray(candidate.wheelAlignment) &&
    isDailyPointArray(candidate.wearLevel)
  );
}

/** unknown → validated tire list. Invalid entries are contract mismatches, not dropped rows. */
export function toVehicleTireTrendTires(raw: unknown): TireTrendTire[] {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleTireTrendContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null || !("tires" in content)) {
    throw new VehicleTireTrendContractMismatchError("`content` is missing the `tires` field");
  }
  const tires = (content as Record<string, unknown>).tires;
  if (!Array.isArray(tires)) {
    throw new VehicleTireTrendContractMismatchError("`content.tires` is not an array");
  }

  const items: TireTrendTire[] = [];
  for (const entry of tires) {
    if (!isTireTrendTire(entry)) {
      throw new VehicleTireTrendContractMismatchError(
        "array entry is missing a required field or has an invalid type",
      );
    }
    items.push(entry);
  }
  return items;
}

function seriesForMetric(tire: TireTrendTire, metric: TireTrendMetric): TireTrendDailyPoint[] {
  const key: TireTrendSeriesKey = TIRE_TREND_METRIC_SERIES[metric];
  return tire[key];
}

/**
 * Per-tire metric series → chart-wide points (one row per date, four wheel values).
 * Dates are the sorted union of all series dates for the selected metric.
 */
export function toTireTrendPoints(tires: TireTrendTire[], metric: TireTrendMetric): TireTrendPoint[] {
  const byPosition = new Map<WheelPosition, Map<string, number | null>>();
  const dates = new Set<string>();

  for (const tire of tires) {
    const seriesMap = new Map<string, number | null>();
    for (const point of seriesForMetric(tire, metric)) {
      seriesMap.set(point.date, point.value);
      dates.add(point.date);
    }
    byPosition.set(tire.position, seriesMap);
  }

  const sortedDates = [...dates].sort();
  return sortedDates.map((date) => ({
    date,
    fl: byPosition.get("FL")?.get(date) ?? null,
    fr: byPosition.get("FR")?.get(date) ?? null,
    rl: byPosition.get("RL")?.get(date) ?? null,
    rr: byPosition.get("RR")?.get(date) ?? null,
  }));
}

/** True when every wheel value across every date is null (or there are no points). */
export function isTireTrendPointsEmpty(points: TireTrendPoint[]): boolean {
  if (points.length === 0) return true;
  return points.every(
    (point) => point.fl === null && point.fr === null && point.rl === null && point.rr === null,
  );
}

export function buildVehicleTireTrendUrl(
  vehicleId: string,
  graphDays: number = TIRE_TREND_GRAPH_DAYS,
): string {
  if (!isFiniteNumber(graphDays) || graphDays <= 0) {
    throw new Error(`graphDays must be a positive finite number, got ${String(graphDays)}`);
  }
  const params = new URLSearchParams({ graphDays: String(graphDays) });
  return `${dashboardClientEnv.apiBase}${VEHICLE_TIRE_TREND_ENDPOINT_PATH}/${vehicleId}/tires/trend?${params.toString()}`;
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
  signal?: AbortSignal,
): Promise<TireTrendTire[]> {
  const url = buildVehicleTireTrendUrl(vehicleId);
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

  return toVehicleTireTrendTires(body);
}
