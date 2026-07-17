import type { TireDetail } from "@/types/dashboard/vehicle";
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

function isTireDetail(value: unknown): value is TireDetail {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isWheelPosition(candidate.position) &&
    isTireStatus(candidate.status) &&
    isNullableNumber(candidate.expectedReplacementAt) &&
    isNullableNumber(candidate.pressureKpa) &&
    isNullableNumber(candidate.temperatureCelsius) &&
    isNullableNumber(candidate.alignmentDeg) &&
    isNullableNumber(candidate.treadDepthMm)
  );
}

/**
 * unknown → UI model list (PM AC16/AC17). Always exactly 4 entries (one per
 * wheel position, PM Scope) — any other count, a duplicate position or an
 * invalid entry is a contract mismatch, not a dropped/padded row.
 */
export function toVehicleTireDetails(raw: unknown): TireDetail[] {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleTireDetailContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null || !("tires" in content)) {
    throw new VehicleTireDetailContractMismatchError("`content` is missing the `tires` field");
  }
  const tires = (content as Record<string, unknown>).tires;
  if (!Array.isArray(tires)) {
    throw new VehicleTireDetailContractMismatchError("`content.tires` is not an array");
  }

  const seenPositions = new Set<string>();
  const items: TireDetail[] = [];
  for (const entry of tires) {
    if (!isTireDetail(entry)) {
      throw new VehicleTireDetailContractMismatchError(
        "array entry is missing a required field or has an invalid enum value",
      );
    }
    if (seenPositions.has(entry.position)) {
      throw new VehicleTireDetailContractMismatchError(`duplicate wheel position: ${entry.position}`);
    }
    seenPositions.add(entry.position);
    items.push(entry);
  }

  if (items.length !== 4) {
    throw new VehicleTireDetailContractMismatchError(
      `expected exactly 4 tires, got ${items.length}`,
    );
  }

  return items;
}

function buildVehicleTireDetailUrl(vehicleId: string): string {
  return `${dashboardClientEnv.apiBase}/api/dashboard/vehicles/${vehicleId}/tires`;
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
