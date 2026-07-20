import { dashboardClientEnv } from "@/lib/dashboard/env/client";
import type {
  LiveLocation,
  LiveLocationDto,
} from "@/types/dashboard/live-locations";

export const LIVE_LOCATIONS_PATH = "/api/dashboard/live-locations";

export const liveLocationsQueryKey = ["dashboard", "live-locations"] as const;

/**
 * Vitest jsdom AbortSignal vs Node undici 이중 realm 우회.
 * `lib/dashboard/summary/api.ts`와 동일. TODO(#22): tests/setup 정합화 후 제거.
 */
function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLiveLocationDto(value: unknown): value is LiveLocationDto {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.vehicleId === "string" &&
    o.vehicleId.length > 0 &&
    typeof o.plateNumber === "string" &&
    typeof o.model === "string" &&
    isFiniteNumber(o.latitude) &&
    isFiniteNumber(o.longitude) &&
    typeof o.measuredAt === "string"
  );
}

export function toLiveLocation(dto: LiveLocationDto): LiveLocation {
  return {
    vehicleId: dto.vehicleId,
    plateNumber: dto.plateNumber,
    model: dto.model,
    lat: dto.latitude,
    lng: dto.longitude,
    measuredAt: dto.measuredAt,
  };
}

/**
 * 알림 리스트에서 뽑은 vehicleId로 live-locations 전체를 클라이언트 필터한다
 * (API에 query 파라미터 없음 — Decision #64).
 */
export function filterLocationsByVehicleIds(
  locations: LiveLocation[],
  vehicleIds: ReadonlySet<string> | readonly string[],
): LiveLocation[] {
  const idSet =
    vehicleIds instanceof Set ? vehicleIds : new Set(vehicleIds);
  if (idSet.size === 0) return [];
  return locations.filter((location) => idSet.has(location.vehicleId));
}

/**
 * `GET /api/dashboard/live-locations` — 대여 중 차량 최신 GPS.
 * 손상된 행은 건너뛰고 유효한 항목만 반환한다.
 */
export async function fetchLiveLocations(
  signal?: AbortSignal,
): Promise<LiveLocation[]> {
  const url = `${dashboardClientEnv.apiBase}${LIVE_LOCATIONS_PATH}`;
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (signal && isAbortSignalBrandMismatch(cause)) {
      response = await fetch(url);
    } else {
      throw cause;
    }
  }

  if (!response.ok) {
    throw new Error(
      `실시간 위치를 불러오지 못했습니다 (HTTP ${response.status}).`,
    );
  }

  const envelope = (await response.json()) as {
    content?: unknown;
  };
  const rows = Array.isArray(envelope.content) ? envelope.content : [];

  return rows.filter(isLiveLocationDto).map(toLiveLocation);
}
