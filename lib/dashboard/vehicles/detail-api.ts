import type {
  ReservationSummary,
  ReservationSummaryDto,
  VehicleDetailDto,
} from "@/types/dashboard/vehicle";
import {
  isFiniteNumber,
  isIsoDateString,
  isNonEmptyString,
  isVehicleDto,
} from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * TODO(#15): provisional envelope — see `types/dashboard/vehicle.ts`
 * "Issue #15" section header for the full re-verification note.
 */
export class VehicleDetailContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle detail response contract mismatch: ${reason}`);
    this.name = "VehicleDetailContractMismatchError";
  }
}

export type VehicleDetailFetchErrorKind =
  | "not-found"
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

/**
 * Fetch-stage error. `"not-found"` is branched first, ahead of the generic
 * `"client-error"` 4xx case, so `VehicleDetailSection` can show the PM AC6
 * "차량 정보를 찾을 수 없습니다" copy instead of the AC7 generic
 * error+retry copy.
 */
export class VehicleDetailFetchError extends Error {
  constructor(
    public readonly kind: VehicleDetailFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle detail fetch failed: ${kind}`);
    this.name = "VehicleDetailFetchError";
  }
}

function isReservationSummaryDto(value: unknown): value is ReservationSummaryDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.reservationId) &&
    isNonEmptyString(candidate.renterName) &&
    isIsoDateString(candidate.startAt) &&
    isIsoDateString(candidate.returnAt)
  );
}

function isVehicleDetailDto(value: unknown): value is VehicleDetailDto {
  if (!isVehicleDto(value)) return false;
  const candidate = value as unknown as Record<string, unknown>;
  return (
    Array.isArray(candidate.photoUrls) &&
    candidate.photoUrls.every((url) => isNonEmptyString(url)) &&
    Array.isArray(candidate.options) &&
    candidate.options.every((option) => typeof option === "string") &&
    isFiniteNumber(candidate.totalMileageKm) &&
    (candidate.lastInspectedAt === null || isIsoDateString(candidate.lastInspectedAt))
  );
}

export interface VehicleDetailResult {
  vehicle: VehicleDetailDto;
  reservation: ReservationSummaryDto | null;
}

/** unknown → typed result. A malformed vehicle/reservation shape is a contract mismatch, never silently dropped. */
export function toVehicleDetailResult(raw: unknown): VehicleDetailResult {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleDetailContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null || !("vehicle" in content)) {
    throw new VehicleDetailContractMismatchError("`content` is missing the `vehicle` field");
  }
  const { vehicle, reservation } = content as Record<string, unknown>;

  if (!isVehicleDetailDto(vehicle)) {
    throw new VehicleDetailContractMismatchError(
      "`content.vehicle` is missing a required field or has an invalid enum value",
    );
  }
  if (reservation !== null && reservation !== undefined && !isReservationSummaryDto(reservation)) {
    throw new VehicleDetailContractMismatchError(
      "`content.reservation` is neither null nor a valid reservation summary",
    );
  }

  return {
    vehicle,
    reservation: (reservation as ReservationSummaryDto | null | undefined) ?? null,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pure — never calls `new Date()` itself; the caller (a component, at render
 * time) supplies `now` (PM Scope "new Date() 직접 호출 금지"), which also lets
 * tests inject a fixed instant for deterministic output. Rounds up so "less
 * than a day left" still reads as "1일" rather than "0일".
 */
export function computeReservationSummary(
  dto: ReservationSummaryDto,
  now: Date,
): ReservationSummary {
  const diffMs = Date.parse(dto.returnAt) - now.getTime();
  return {
    ...dto,
    daysUntilReturn: Math.ceil(diffMs / DAY_MS),
  };
}

export const VEHICLE_DETAIL_ENDPOINT_PATH = "/api/dashboard/vehicles";

function buildVehicleDetailUrl(vehicleId: string): string {
  return `${dashboardClientEnv.apiBase}${VEHICLE_DETAIL_ENDPOINT_PATH}/${vehicleId}`;
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
export async function fetchVehicleDetail(
  vehicleId: string,
  signal?: AbortSignal,
): Promise<VehicleDetailResult> {
  const url = buildVehicleDetailUrl(vehicleId);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleDetailFetchError(
          "network-error",
          "차량 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleDetailFetchError(
        "network-error",
        "차량 정보를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (response.status === 404) {
    throw new VehicleDetailFetchError(
      "not-found",
      "차량 정보를 찾을 수 없습니다.",
      undefined,
      404,
    );
  }

  if (!response.ok) {
    throw new VehicleDetailFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "차량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleDetailFetchError(
      "malformed-response",
      "차량 정보를 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleDetailResult(body);
}
