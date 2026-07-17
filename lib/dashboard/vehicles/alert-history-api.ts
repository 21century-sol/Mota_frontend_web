import type { AlertHistoryItem } from "@/types/dashboard/vehicle";
import { isWheelPosition } from "@/types/dashboard/vehicle";
import { isIsoDateString, isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * TODO(#15): provisional envelope — see `types/dashboard/vehicle.ts`
 * "Issue #15" section header.
 */
export class VehicleAlertHistoryContractMismatchError extends Error {
  constructor(reason: string) {
    super(`Vehicle alert history response contract mismatch: ${reason}`);
    this.name = "VehicleAlertHistoryContractMismatchError";
  }
}

export type VehicleAlertHistoryFetchErrorKind =
  | "network-error"
  | "client-error"
  | "server-error"
  | "malformed-response";

export class VehicleAlertHistoryFetchError extends Error {
  constructor(
    public readonly kind: VehicleAlertHistoryFetchErrorKind,
    public readonly userMessage: string,
    public readonly cause?: unknown,
    public readonly status?: number,
  ) {
    super(`Vehicle alert history fetch failed: ${kind}`);
    this.name = "VehicleAlertHistoryFetchError";
  }
}

function isAlertHistoryItem(value: unknown): value is AlertHistoryItem {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    (candidate.tirePosition === null || isWheelPosition(candidate.tirePosition)) &&
    typeof candidate.message === "string" &&
    isIsoDateString(candidate.occurredAt)
  );
}

/** unknown → UI model list (PM AC10/AC11). A duplicate `id` or invalid entry is a contract mismatch, not a dropped row. */
export function toVehicleAlertHistoryItems(raw: unknown): AlertHistoryItem[] {
  if (typeof raw !== "object" || raw === null || !("content" in raw)) {
    throw new VehicleAlertHistoryContractMismatchError(
      "response is missing the `content` envelope field",
    );
  }
  const content = (raw as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null || !("alerts" in content)) {
    throw new VehicleAlertHistoryContractMismatchError("`content` is missing the `alerts` field");
  }
  const alerts = (content as Record<string, unknown>).alerts;
  if (!Array.isArray(alerts)) {
    throw new VehicleAlertHistoryContractMismatchError("`content.alerts` is not an array");
  }

  const seenIds = new Set<string>();
  const items: AlertHistoryItem[] = [];
  for (const entry of alerts) {
    if (!isAlertHistoryItem(entry)) {
      throw new VehicleAlertHistoryContractMismatchError(
        "array entry is missing a required field or has an invalid `tirePosition`",
      );
    }
    if (seenIds.has(entry.id)) {
      throw new VehicleAlertHistoryContractMismatchError(`duplicate alert id: ${entry.id}`);
    }
    seenIds.add(entry.id);
    items.push(entry);
  }
  return items;
}

function buildVehicleAlertHistoryUrl(vehicleId: string): string {
  return `${dashboardClientEnv.apiBase}/api/dashboard/vehicles/${vehicleId}/alerts`;
}

function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/** Query function body. Forwards the React Query `signal` so refetches cancel in-flight requests. */
export async function fetchVehicleAlertHistory(
  vehicleId: string,
  signal?: AbortSignal,
): Promise<AlertHistoryItem[]> {
  const url = buildVehicleAlertHistoryUrl(vehicleId);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;

    if (signal && isAbortSignalBrandMismatch(cause)) {
      try {
        response = await fetch(url);
      } catch (retryCause) {
        throw new VehicleAlertHistoryFetchError(
          "network-error",
          "알림 이력을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
          retryCause,
        );
      }
    } else {
      throw new VehicleAlertHistoryFetchError(
        "network-error",
        "알림 이력을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
        cause,
      );
    }
  }

  if (!response.ok) {
    throw new VehicleAlertHistoryFetchError(
      response.status >= 500 ? "server-error" : "client-error",
      "알림 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new VehicleAlertHistoryFetchError(
      "malformed-response",
      "알림 이력을 해석할 수 없습니다.",
      cause,
    );
  }

  return toVehicleAlertHistoryItems(body);
}
