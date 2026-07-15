/**
 * Status enum for the dashboard summary cards (issue #11). May be shared with
 * #14 (vehicle list status filter) per `.claude/handoffs/11-api-specs.md` (DTO
 * design "안 B"). MSW-only contract — the backend enum is not confirmed yet and
 * must be re-validated once a real endpoint is available.
 */
export type VehicleStatus = "OWNED" | "AVAILABLE" | "RENTED" | "UNAVAILABLE";

export const VEHICLE_STATUSES: readonly VehicleStatus[] = [
  "OWNED",
  "AVAILABLE",
  "RENTED",
  "UNAVAILABLE",
] as const;

export interface VehicleStatusCountDto {
  status: VehicleStatus;
  count: number;
}

/** Response body shape (DTO안 B): one entry per status. */
export type VehicleStatusCountDtoList = VehicleStatusCountDto[];

/** UI model consumed by SummaryCardsSection/SummaryCard. Maps 1:1 to the 4 Figma cards. */
export interface VehicleSummaryCounts {
  ownedCount: number;
  availableCount: number;
  rentedCount: number;
  unavailableCount: number;
}
