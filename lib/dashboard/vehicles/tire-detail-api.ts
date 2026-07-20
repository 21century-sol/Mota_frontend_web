import type { TireDetail, TireStatus, WheelPosition } from "@/types/dashboard/vehicle";
import { isTireStatus, isWheelPosition } from "@/types/dashboard/vehicle";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * TODO(#15): provisional envelope — see `types/dashboard/vehicle.ts`
 * "Issue #15" section header.
 */
export class VehicleTireDetailContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle tire detail response contract mismatch: ${reason}`);
    this.name = "VehicleTireDetailContractMismatchError";
  }
}

export type VehicleTireDetailFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

export class VehicleTireDetailFetchError extends Error {
  constructor(
    public readonly kind: VehicleTireDetailFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle tire detail fetch failed: ${kind}`);
    this.name = "VehicleTireDetailFetchError";
  }
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

/**
 * 실제 백엔드 `GET /api/vehicles/{id}/tires` 한 바퀴 응답(`TireResponse`):
 * `{ tireId, position, status, pressure, temperature, alignment, wearLevel, friction, expectedReplacementKm }`.
 * 프론트 UI 모델(`TireDetail`)로 넘어오며 필드가 매핑된다(아래 `toTireDetail` 참고).
 */
interface TireResponseDto {
  position: WheelPosition;
  status: TireStatus;
  pressure: number | null;
  temperature: number | null;
  alignment: number | null;
  wearLevel: number | null;
  expectedReplacementKm?: number | null;
}

function isTireResponseDto(value: unknown): value is TireResponseDto {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    isWheelPosition(c.position) &&
    // status는 앱이 저장한 바퀴별 상태. 백엔드가 status를 아직 안 주는(구버전) 경우를 대비해
    // 누락 시 NORMAL로 관대하게 처리하되, 값이 있으면 유효한 enum이어야 한다.
    (c.status === undefined || isTireStatus(c.status)) &&
    isNullableNumber(c.pressure) &&
    isNullableNumber(c.temperature) &&
    isNullableNumber(c.alignment) &&
    isNullableNumber(c.wearLevel) &&
    (c.expectedReplacementKm === undefined || isNullableNumber(c.expectedReplacementKm))
  );
}

/** 백엔드 `TireResponse.RATED_LIFE_KM`과 동일한 마모→잔여 km 정격 수명. */
export const TIRE_RATED_LIFE_KM = 40_000;

/** 백엔드와 동일한 마모→잔여 km 식. MSW·구버전 응답 폴백용. */
export function expectedReplacementKmFromWear(wearLevel: number | null | undefined): number | null {
  if (wearLevel === null || wearLevel === undefined) return null;
  const wear = Math.max(0, Math.min(100, wearLevel));
  return Math.round(((100 - wear) / 100) * TIRE_RATED_LIFE_KM);
}

/**
 * 백엔드 DTO → UI 모델 매핑. 백엔드는 `wearLevel`(마모도 %)을 주며 UI의 `treadDepthMm`
 * 슬롯이 이미 % 값을 표시한다(`formatWearLabel`). `expectedReplacementKm`은 마모 기반
 * 잔여 거리(km)이며 UI의 `expectedReplacementAt`으로 매핑한다.
 */
function toTireDetail(dto: TireResponseDto): TireDetail {
  return {
    position: dto.position,
    status: dto.status ?? "NORMAL",
    pressureKpa: dto.pressure,
    temperatureCelsius: dto.temperature,
    alignmentDeg: dto.alignment,
    treadDepthMm: dto.wearLevel,
    expectedReplacementAt:
      dto.expectedReplacementKm !== undefined
        ? dto.expectedReplacementKm
        : expectedReplacementKmFromWear(dto.wearLevel),
  };
}

/**
 * unknown → UI model list (PM AC16/AC17). Always exactly 4 entries (one per
 * wheel position, PM Scope) — any other count, a duplicate position or an
 * invalid entry is a contract mismatch, not a dropped/padded row.
 * 봉투는 `{ content: TireResponse[], error, statusCode }` (content가 배열 그 자체).
 */
export function toVehicleTireDetails(raw: unknown): TireDetail[] {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleTireDetailContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (!Array.isArray(content)) {
    throw new VehicleTireDetailContractMismatchError("`content` is not an array");
  }

  const seenPositions = new Set<string>();
  const items: TireDetail[] = [];
  for (const entry of content) {
    if (!isTireResponseDto(entry)) {
      throw new VehicleTireDetailContractMismatchError(
        "array entry is missing a required field or has an invalid enum value",
      );
    }
    if (seenPositions.has(entry.position)) {
      throw new VehicleTireDetailContractMismatchError(`duplicate wheel position: ${entry.position}`);
    }
    seenPositions.add(entry.position);
    items.push(toTireDetail(entry));
  }

  if (items.length !== 4) {
    throw new VehicleTireDetailContractMismatchError(
      `expected exactly 4 tires, got ${items.length}`,
    );
  }

  return items;
}

function buildVehicleTireDetailUrl(vehicleId: string): string {
  return `${dashboardClientEnv.apiBase}/api/vehicles/${vehicleId}/tires`;
}

function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchVehicleTireDetails(
  vehicleId: string,
  signal?: AbortSignal,
): Promise<TireDetail[]> {
  const url = buildVehicleTireDetailUrl(vehicleId);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleTireDetailFetchError(
          "network-error",
          "타이어 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleTireDetailFetchError(
        "network-error",
        "타이어 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleTireDetailFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "타이어 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleTireDetailFetchError(
      "malformed-response",
      "타이어 정보를 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleTireDetails(body);
}
