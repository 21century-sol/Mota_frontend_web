import type { AlertHistoryItem } from "@/types/dashboard/vehicle";
import { isAlertLevel, isWheelPosition } from "@/types/dashboard/vehicle";
import { isNonEmptyString } from "@/lib/dashboard/vehicles/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * Reserved for a genuinely malformed/unexpected response shape — a
 * well-formed envelope reporting a business failure
 * (`statusCode !== 200 || error !== null`) is a
 * {@link VehicleAlertHistoryFetchError} instead (issue #47, same 2-stage
 * split as `current-rental-api.ts`/`detail-api.ts`).
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

/**
 * "YYYY.MM.DD HH:mm:ss" — KST wall-clock wire format (not ISO, no timezone
 * suffix). Locally re-defined (not imported from `current-rental-api.ts`,
 * whose same-named pattern is module-private) — PM handoff Assumption A1,
 * `.claude/handoffs/47-pm.md`.
 */
const WIRE_DATETIME_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function isWireDateTimeString(value: unknown): value is string {
  return typeof value === "string" && WIRE_DATETIME_PATTERN.test(value);
}

function isAlertHistoryItem(value: unknown): value is AlertHistoryItem {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.alertId) &&
    isNonEmptyString(candidate.tireId) &&
    isWheelPosition(candidate.position) &&
    isAlertLevel(candidate.alertLevel) &&
    isNonEmptyString(candidate.alertTitle) &&
    isWireDateTimeString(candidate.alertTime)
  );
}

/**
 * unknown → typed `AlertHistoryItem[]` (issue #47). Same 2-stage envelope
 * pattern as `current-rental-api.ts`/`detail-api.ts`: a business failure
 * (`statusCode !== 200 || error !== null`) is a
 * {@link VehicleAlertHistoryFetchError}, a malformed `content` shape — not an
 * array, an invalid entry, or a duplicate `alertId` — is a
 * {@link VehicleAlertHistoryContractMismatchError}. `content` is the array
 * directly (no `alerts` wrapping) and entries are pushed in the server's
 * given order — never re-sorted (PM/API handoff: server already returns
 * newest-first).
 */
export function toVehicleAlertHistoryItems(raw: unknown): AlertHistoryItem[] {
  if (typeof raw !== "object" || raw === null) {
    throw new VehicleAlertHistoryContractMismatchError("response is not an object");
  }
  const envelope = raw as Record<string, unknown>;

  if (typeof envelope.statusCode !== "number") {
    throw new VehicleAlertHistoryContractMismatchError(
      "response is missing a numeric `statusCode` field",
    );
  }
  if (envelope.statusCode !== 200 || envelope.error !== null) {
    throw new VehicleAlertHistoryFetchError(
      envelope.statusCode >= 500 ? "server-error" : "client-error",
      "알림 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      undefined,
      envelope.statusCode,
    );
  }

  const content = envelope.content;
  if (!Array.isArray(content)) {
    throw new VehicleAlertHistoryContractMismatchError("`content` is not an array");
  }

  const seenIds = new Set<string>();
  const items: AlertHistoryItem[] = [];
  for (const entry of content) {
    if (!isAlertHistoryItem(entry)) {
      throw new VehicleAlertHistoryContractMismatchError(
        "array entry is missing a required field or has an invalid enum/date value",
      );
    }
    if (seenIds.has(entry.alertId)) {
      throw new VehicleAlertHistoryContractMismatchError(
        `duplicate alert id: ${entry.alertId}`,
      );
    }
    seenIds.add(entry.alertId);
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
