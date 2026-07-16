import type {
  VehicleDto,
  VehicleListFilters,
  VehicleListItem,
} from "@/types/dashboard/vehicle";
import {
  isFuelType,
  isTireStatus,
  isVehicleManagementStatus,
  isVehicleType,
} from "@/types/dashboard/vehicle";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * The `content.vehicles` envelope shape is confirmed (unlike issue #11/#12's
 * unresolved bare-array-vs-envelope question) — a response missing that shape
 * is a genuine contract mismatch, not an ambiguity to silently absorb.
 */
export class VehicleListContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle list response contract mismatch: ${reason}`);
    this.name = "VehicleListContractMismatchError";
  }
}

export type VehicleListFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

/** Fetch-stage error. Keeps the user-facing message separate from the internal cause. */
export class VehicleListFetchError extends Error {
  constructor(
    public readonly kind: VehicleListFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle list fetch failed: ${kind}`);
    this.name = "VehicleListFetchError";
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIsoDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

/** Validates all 12 confirmed fields; an unknown enum value or missing field is a contract mismatch, not a dropped row. */
function isVehicleDto(value: unknown): value is VehicleDto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.vehicleId) &&
    isNonEmptyString(candidate.plateNumber) &&
    isNonEmptyString(candidate.model) &&
    isFiniteNumber(candidate.modelYear) &&
    isNonEmptyString(candidate.manufacturer) &&
    isVehicleType(candidate.vehicleType) &&
    isFuelType(candidate.fuelType) &&
    isNonEmptyString(candidate.imageUrl) &&
    isVehicleManagementStatus(candidate.status) &&
    (candidate.tireStatus === null || isTireStatus(candidate.tireStatus)) &&
    (candidate.rentedAt === null || isIsoDateString(candidate.rentedAt)) &&
    (candidate.returnedAt === null || isIsoDateString(candidate.returnedAt))
  );
}

/**
 * Only the single confirmed envelope shape (`{ content: { vehicles } }`) is
 * accepted — no legacy bare-array fallback is needed for this issue
 * (`.claude/handoffs/14-api-specs.md` Contract status: 확정).
 */
function extractVehicleDtoArray(raw: unknown): unknown[] {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleListContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null || !("vehicles" in content)) {
    throw new VehicleListContractMismatchError(
      "`content` is missing the `vehicles` field",
    );
  }
  const vehicles = (content as Record<string, unknown>).vehicles;
  if (!Array.isArray(vehicles)) {
    throw new VehicleListContractMismatchError(
      "`content.vehicles` is not an array",
    );
  }
  return vehicles;
}

/**
 * unknown → UI model list. A duplicate `vehicleId` or any entry failing
 * shape/enum validation is treated as a contract mismatch rather than being
 * dropped silently (same precedent as issue #11/#12's `toXxx` adapters).
 */
export function toVehicleListItems(raw: unknown): VehicleListItem[] {
  const dtoArray = extractVehicleDtoArray(raw);
  const seenIds = new Set<string>();
  const items: VehicleListItem[] = [];

  for (const entry of dtoArray) {
    if (!isVehicleDto(entry)) {
      throw new VehicleListContractMismatchError(
        "array entry is missing a required field or has an invalid enum value",
      );
    }
    if (seenIds.has(entry.vehicleId)) {
      throw new VehicleListContractMismatchError(
        `duplicate vehicleId: ${entry.vehicleId}`,
      );
    }
    seenIds.add(entry.vehicleId);
    items.push({ ...entry });
  }

  return items;
}

export const VEHICLES_ENDPOINT_PATH = "/api/vehicles/management";

/**
 * Same jsdom/undici `AbortSignal` realm mismatch worked around in
 * `lib/dashboard/summary/api.ts` / `lib/dashboard/alerts/api.ts` — never
 * happens in real browsers.
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

function buildVehiclesUrl(filters: VehicleListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tireStatus) params.set("tireStatus", filters.tireStatus);
  const query = params.toString();
  return `${dashboardClientEnv.apiBase}${VEHICLES_ENDPOINT_PATH}${query ? `?${query}` : ""}`;
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchVehicles(
  filters: VehicleListFilters,
  signal?: AbortSignal,
): Promise<VehicleListItem[]> {
  const url = buildVehiclesUrl(filters);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause; // Cancellation: let React Query handle it as-is.

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleListFetchError(
          "network-error",
          "차량 목록을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleListFetchError(
        "network-error",
        "차량 목록을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleListFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "차량 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleListFetchError(
      "malformed-response",
      "차량 목록을 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleListItems(body);
}
