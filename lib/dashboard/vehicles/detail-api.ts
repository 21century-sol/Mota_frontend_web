import type { VehicleDetailDto } from "@/types/dashboard/vehicle";
import {
  isFuelType,
  isTireStatus,
  isVehicleOption,
  isVehicleType,
} from "@/types/dashboard/vehicle";
import { isFiniteNumber, isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Reserved for a genuinely malformed/unexpected response shape (missing
 * field, invalid enum value) — a well-formed envelope reporting a business
 * failure (`statusCode !== 200 || error !== null`) is a
 * {@link VehicleDetailFetchError} instead (issue #42, same split as the #14
 * list adapter's `extractVehicleListContent`).
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
 * Fetch/business-failure error. `"not-found"` is branched first, ahead of the
 * generic `"client-error"` 4xx case, so `VehicleDetailSection` can show the
 * PM AC6 "차량 정보를 찾을 수 없습니다" copy instead of the AC7 generic
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

const YMD_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isYmdDateString(value: unknown): value is string {
  return typeof value === "string" && YMD_DATE_PATTERN.test(value);
}

/** Validates every confirmed `VehicleDetailDto` field (issue #42 contract) plus `options` uniqueness. */
function isVehicleDetailDto(value: unknown): value is VehicleDetailDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  if (
    !isNonEmptyString(candidate.vehicleId) ||
    !Array.isArray(candidate.imageUrls) ||
    !candidate.imageUrls.every((url) => isNonEmptyString(url)) ||
    !isNonEmptyString(candidate.plateNumber) ||
    !isNonEmptyString(candidate.manufacturer) ||
    !isNonEmptyString(candidate.model) ||
    !isNonEmptyString(candidate.modelCode) ||
    !isFiniteNumber(candidate.modelYear) ||
    !isVehicleType(candidate.vehicleType) ||
    !isFuelType(candidate.fuelType) ||
    !Array.isArray(candidate.options) ||
    !candidate.options.every((option) => isVehicleOption(option)) ||
    !isFiniteNumber(candidate.mileage) ||
    !isYmdDateString(candidate.lastInspectedAt) ||
    !isTireStatus(candidate.tireStatus)
  ) {
    return false;
  }

  return new Set(candidate.options).size === candidate.options.length;
}

/**
 * unknown → typed `VehicleDetailDto`. Envelope-level business failure
 * (`statusCode !== 200 || error !== null`) inside an otherwise well-formed
 * response is surfaced as a {@link VehicleDetailFetchError} — same "couldn't
 * load, retry" UX as an HTTP-level error — rather than a
 * {@link VehicleDetailContractMismatchError}, which stays reserved for a
 * malformed/unexpected shape (matches `lib/dashboard/vehicles/api.ts`
 * `extractVehicleListContent`, PM Assumption A4).
 */
export function toVehicleDetailDto(raw: unknown): VehicleDetailDto {
  if (typeof raw !== "object" || raw === null) {
    throw new VehicleDetailContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new VehicleDetailContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new VehicleDetailFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "차량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }

  const content = envelope.content;
  if (!isVehicleDetailDto(content)) {
    throw new VehicleDetailContractMismatchError(
      "`content` is missing a required field or has an invalid enum value",
    );
  }

  return content;
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
): Promise<VehicleDetailDto> {
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

  return toVehicleDetailDto(body);
}
