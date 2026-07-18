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

/**
 * `export`ed (issue #15) so the 5 new `/dashboard/vehicles/[vehicleId]`
 * adapters can reuse the same primitive validators instead of duplicating
 * them — behavior unchanged (additive-only per `.claude/handoffs/15-api-specs.md`).
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isIsoDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

/** Validates all 12 confirmed fields; an unknown enum value or missing field is a contract mismatch, not a dropped row. */
export function isVehicleDto(value: unknown): value is VehicleDto {
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

/** Validated `content` shape — the raw `vehicles` array plus the `refreshedAt` timestamp (issue #35). */
interface VehicleListEnvelopeContent {
  vehicles: unknown[];
  refreshedAt: string;
}

/**
 * Only the single confirmed envelope shape (`{ statusCode, error, content: { vehicles, refreshedAt } }`)
 * is accepted — no legacy bare-array fallback is needed for this issue
 * (`.claude/handoffs/14-api-specs.md` Contract status: 확정). `statusCode !== 200`
 * or `error !== null` is a business-level failure inside an otherwise
 * well-formed response, so it is surfaced as a {@link VehicleListFetchError}
 * (issue #33, same "couldn't load, retry" UX as an HTTP error, matching the
 * #31 summary-card precedent) rather than a
 * {@link VehicleListContractMismatchError}, which stays reserved for a
 * malformed/unexpected shape.
 *
 * `content.refreshedAt` (issue #35) is validated here alongside `vehicles`
 * instead of a second pass over `content`, since both live on the same
 * already-parsed envelope object.
 */
function extractVehicleListContent(raw: unknown): VehicleListEnvelopeContent {
  if (typeof raw !== "object" || raw === null) {
    throw new VehicleListContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new VehicleListContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new VehicleListFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "차량 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }

  const content = envelope.content;
  if (typeof content !== "object" || content === null || !("vehicles" in content)) {
    throw new VehicleListContractMismatchError(
      "`content` is missing the `vehicles` field",
    );
  }
  const { vehicles, refreshedAt } = content as Record<string, unknown>;
  if (!Array.isArray(vehicles)) {
    throw new VehicleListContractMismatchError(
      "`content.vehicles` is not an array",
    );
  }
  if (typeof refreshedAt !== "string") {
    throw new VehicleListContractMismatchError(
      "`content.refreshedAt` is missing or not a string",
    );
  }

  return { vehicles, refreshedAt };
}

/**
 * unknown → UI model list + `refreshedAt` (issue #35). A duplicate
 * `vehicleId` or any entry failing shape/enum validation is treated as a
 * contract mismatch rather than being dropped silently (same precedent as
 * issue #11/#12's `toXxx` adapters).
 */
export function toVehicleListItems(
  raw: unknown,
): { vehicles: VehicleListItem[]; refreshedAt: string } {
  const { vehicles: dtoArray, refreshedAt } = extractVehicleListContent(raw);
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

  return { vehicles: items, refreshedAt };
}

/**
 * Confirmed backend endpoint (issue #33, Swagger
 * `https://mota-app.duckdns.org/swagger-ui/index.html#/Vehicle/getVehicleManagementList`).
 * Replaces the #14 provisional path (`/api/vehicles/management`).
 */
export const VEHICLES_ENDPOINT_PATH = "/api/vehicles/search";

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

/**
 * The confirmed backend contract only accepts a single `tireStatus` value
 * (`.claude/handoffs/33-api-specs.md`), so a multi-select client selection
 * (issue #35) can only be forwarded to the server when exactly 1 value is
 * selected: 0 selected omits the param (no filter), 2+ selected also omits
 * it and the OR-match across the selected set is instead applied client-side
 * (`VehicleListSection.tsx`) against the unfiltered response.
 */
function buildVehiclesUrl(filters: VehicleListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tireStatus.length === 1) {
    params.set("tireStatus", filters.tireStatus[0]);
  }
  const query = params.toString();
  return `${dashboardClientEnv.apiBase}${VEHICLES_ENDPOINT_PATH}${query ? `?${query}` : ""}`;
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchVehicles(
  filters: VehicleListFilters,
  signal?: AbortSignal,
): Promise<{ vehicles: VehicleListItem[]; refreshedAt: string }> {
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
