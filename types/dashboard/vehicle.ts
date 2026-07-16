/**
 * DTO/UI-model types for the `/dashboard/vehicles` list (issue #14). Confirmed
 * against the real backend Swagger spec
 * (`https://mota-app.duckdns.org/api-docs`, `GET /api/vehicles/management`) —
 * see `.claude/handoffs/14-api-specs.md`.
 *
 * This is a *different* domain enum from `types/dashboard/summary.ts`'s
 * `VehicleStatus` (issue #11, `/dashboard` home summary cards, includes
 * `OWNED`). The two must never be imported into each other's module (PM
 * Decision 1, `.claude/handoffs/14-pm-breakdown.md`) — `summary.ts` is a
 * protected file for this issue and is intentionally not imported here.
 */
export type VehicleManagementStatus = "AVAILABLE" | "RENTED" | "REPAIR";

export const VEHICLE_MANAGEMENT_STATUSES: readonly VehicleManagementStatus[] =
  ["AVAILABLE", "RENTED", "REPAIR"] as const;

export function isVehicleManagementStatus(
  value: unknown,
): value is VehicleManagementStatus {
  return (
    typeof value === "string" &&
    (VEHICLE_MANAGEMENT_STATUSES as readonly string[]).includes(value)
  );
}

export type TireStatus = "NORMAL" | "CAUTION" | "WARNING";

export const TIRE_STATUSES: readonly TireStatus[] = [
  "NORMAL",
  "CAUTION",
  "WARNING",
] as const;

export function isTireStatus(value: unknown): value is TireStatus {
  return (
    typeof value === "string" &&
    (TIRE_STATUSES as readonly string[]).includes(value)
  );
}

export type VehicleType = "SEDAN" | "SUV" | "HATCHBACK";

const VEHICLE_TYPES: readonly VehicleType[] = [
  "SEDAN",
  "SUV",
  "HATCHBACK",
] as const;

export function isVehicleType(value: unknown): value is VehicleType {
  return (
    typeof value === "string" &&
    (VEHICLE_TYPES as readonly string[]).includes(value)
  );
}

export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC";

const FUEL_TYPES: readonly FuelType[] = [
  "GASOLINE",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
] as const;

export function isFuelType(value: unknown): value is FuelType {
  return (
    typeof value === "string" && (FUEL_TYPES as readonly string[]).includes(value)
  );
}

/**
 * One vehicle entry as returned by `GET /api/vehicles/management`.
 * `imageUrl` is confirmed non-null (Swagger re-check, `.claude/handoffs/14-api-specs.md`).
 * `tireStatus`/`rentedAt`/`returnedAt` are nullable — the UI must render an
 * explicit placeholder ("—") instead of an empty string (PM AC1).
 */
export interface VehicleDto {
  vehicleId: string;
  plateNumber: string;
  model: string;
  modelYear: number;
  manufacturer: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  imageUrl: string;
  status: VehicleManagementStatus;
  tireStatus: TireStatus | null;
  rentedAt: string | null;
  returnedAt: string | null;
}

/**
 * UI model consumed by the vehicle list components. 1:1 with `VehicleDto` (no
 * derived fields) — date/tire-status label formatting is a presentation
 * concern, done at render time from the original ISO/null values.
 */
export interface VehicleListItem extends VehicleDto {}

/** `status`/`tireStatus` query filters. Both optional and independent (AND when both set). */
export interface VehicleListFilters {
  status?: VehicleManagementStatus;
  tireStatus?: TireStatus;
}

export interface VehicleManagementListContent {
  refreshedAt: string;
  vehicles: VehicleDto[];
}

/** Response envelope shape (single, confirmed — no legacy bare-array fallback needed). */
export interface VehicleManagementListResponse {
  statusCode: number;
  error: string | null;
  content: VehicleManagementListContent;
}
