import type { PageInfo, UsageHistoryItem } from "@/types/dashboard/vehicle";
import { isFiniteNumber, isIsoDateString, isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * TODO(#15): provisional envelope — see `types/dashboard/vehicle.ts`
 * "Issue #15" section header.
 */
export class VehicleUsageHistoryContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle usage history response contract mismatch: ${reason}`);
    this.name = "VehicleUsageHistoryContractMismatchError";
  }
}

export type VehicleUsageHistoryFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

export class VehicleUsageHistoryFetchError extends Error {
  constructor(
    public readonly kind: VehicleUsageHistoryFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle usage history fetch failed: ${kind}`);
    this.name = "VehicleUsageHistoryFetchError";
  }
}

function isUsageHistoryItem(value: unknown): value is UsageHistoryItem {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.renterName) &&
    isNonEmptyString(candidate.renterPhone) &&
    isIsoDateString(candidate.rentedAt) &&
    (candidate.returnedAt === null || isIsoDateString(candidate.returnedAt)) &&
    isFiniteNumber(candidate.mileageKm) &&
    isFiniteNumber(candidate.alertCount)
  );
}

function isPageInfo(value: unknown): value is PageInfo {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isFiniteNumber(candidate.page) &&
    isFiniteNumber(candidate.pageSize) &&
    isFiniteNumber(candidate.totalCount) &&
    isFiniteNumber(candidate.totalPages)
  );
}

export interface VehicleUsageHistoryResult {
  items: UsageHistoryItem[];
  pageInfo: PageInfo;
}

/** unknown → typed result (PM AC19/AC20). A malformed item or pageInfo is a contract mismatch, not a dropped row. */
export function toVehicleUsageHistoryResult(raw: unknown): VehicleUsageHistoryResult {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleUsageHistoryContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (
    typeof content !== "object" ||
    content === null ||
    !("items" in content) ||
    !("pageInfo" in content)
  ) {
    throw new VehicleUsageHistoryContractMismatchError(
      "`content` is missing the `items`/`pageInfo` field",
    );
  }
  const { items, pageInfo } = content as Record<string, unknown>;
  if (!Array.isArray(items)) {
    throw new VehicleUsageHistoryContractMismatchError("`content.items` is not an array");
  }
  if (!isPageInfo(pageInfo)) {
    throw new VehicleUsageHistoryContractMismatchError("`content.pageInfo` has an invalid shape");
  }

  const seenIds = new Set<string>();
  const result: UsageHistoryItem[] = [];
  for (const entry of items) {
    if (!isUsageHistoryItem(entry)) {
      throw new VehicleUsageHistoryContractMismatchError(
        "array entry is missing a required field or has an invalid type",
      );
    }
    if (seenIds.has(entry.id)) {
      throw new VehicleUsageHistoryContractMismatchError(`duplicate usage history id: ${entry.id}`);
    }
    seenIds.add(entry.id);
    result.push(entry);
  }

  return { items: result, pageInfo };
}

export const VEHICLE_USAGE_HISTORY_PAGE_SIZE = 8;

function buildVehicleUsageHistoryUrl(vehicleId: string, page: number): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(VEHICLE_USAGE_HISTORY_PAGE_SIZE),
  });
  return `${dashboardClientEnv.apiBase}/api/dashboard/vehicles/${vehicleId}/usage-history?${params.toString()}`;
}

function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchVehicleUsageHistory(
  vehicleId: string,
  page: number,
  signal?: AbortSignal,
): Promise<VehicleUsageHistoryResult> {
  const url = buildVehicleUsageHistoryUrl(vehicleId, page);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleUsageHistoryFetchError(
          "network-error",
          "이용 이력을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleUsageHistoryFetchError(
        "network-error",
        "이용 이력을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleUsageHistoryFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "이용 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleUsageHistoryFetchError(
      "malformed-response",
      "이용 이력을 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleUsageHistoryResult(body);
}
