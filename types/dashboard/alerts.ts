/**
 * DTO/UI-model types for the `/dashboard` real-time alerts list + vehicle map
 * (issue #12). MSW-only contract — no OpenAPI spec exists yet
 * (`.claude/handoffs/12-api-specs.md`), so this must be re-validated once a real
 * backend endpoint is available.
 */
export type AlertSeverity = "DANGER" | "CAUTION";

export const ALERT_SEVERITIES: readonly AlertSeverity[] = [
  "DANGER",
  "CAUTION",
] as const;

export interface AlertLocationDto {
  lat: number;
  lng: number;
}

export interface AlertDto {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string;
  /**
   * Kept on the DTO for forward-compatibility, but intentionally not surfaced
   * anywhere in the UI model/screen (Decision Resolved 2026-07-16 #3,
   * `.claude/handoffs/12-api-specs.md`) — the Figma alert items show only the
   * plate number, not a combined "plate + model" string.
   */
  vehicleModel: string;
  description: string;
  severity: AlertSeverity;
  /** ISO 8601 timestamp. Timezone is unconfirmed (UTC assumed) — non-blocking per PM handoff. */
  occurredAt: string;
  location: AlertLocationDto;
}

export type AlertDtoList = AlertDto[];

/** UI model consumed by `AlertsList`/`VehicleMap`. */
export interface AlertItem {
  id: string;
  vehicleId: string;
  /** Plate number only — see `AlertDto.vehicleModel` comment above. */
  vehiclePlateNumber: string;
  description: string;
  severity: AlertSeverity;
  occurredAtIso: string;
  /** Precomputed relative-time label (e.g. "2분 전"), see `lib/dashboard/alerts/api.ts`. */
  occurredAtLabel: string;
  location: AlertLocationDto;
}

export type AlertItemList = AlertItem[];
