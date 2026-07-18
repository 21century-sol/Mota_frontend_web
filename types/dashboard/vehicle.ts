/**
 * DTO/UI-model types for the `/dashboard/vehicles` list (issue #14). Confirmed
 * against the real backend Swagger spec
 * (`https://mota-app.duckdns.org/swagger-ui/index.html#/Vehicle/getVehicleManagementList`,
 * `GET /api/vehicles/search`, issue #33) — see `.claude/handoffs/14-api-specs.md`
 * and `.claude/handoffs/33-api-specs.md`.
 *
 * This is a *different* domain enum from `types/dashboard/summary.ts`'s
 * dashboard-summary content DTO (issue #11/#31, `/dashboard` home summary
 * cards). The two must never be imported into each other's module (PM
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
 * One vehicle entry as returned by `GET /api/vehicles/search` (issue #33).
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

/**
 * `status`/`tireStatus` query filters. `status` stays single-select/optional.
 * `tireStatus` is multi-select (issue #35 AC4/AC7) — an empty array means "no
 * filter", never `undefined`, so callers can't forget to handle the
 * no-selection case. 0/1/2+ selected values change how the filter is applied
 * (server-side for 0/1, client-side OR-match for 2+) — see
 * `lib/dashboard/vehicles/api.ts` (`buildVehiclesUrl`) and
 * `components/dashboard/vehicles/VehicleListSection.tsx`.
 */
export interface VehicleListFilters {
  status?: VehicleManagementStatus;
  tireStatus: readonly TireStatus[];
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

// ---------------------------------------------------------------------------
// Issue #15 — `/dashboard/vehicles/[vehicleId]` detail screen.
//
// TODO(#15): Swagger re-check failed twice (502) — every type below is
// provisional (`.claude/handoffs/15-api-specs.md` "Contract status"). Field
// names, units and the envelope shape must be re-verified once the real
// backend contract is confirmed, and the 5 adapters in `lib/dashboard/vehicles/`
// that consume them re-validated at that point.
// ---------------------------------------------------------------------------

/**
 * `GET /api/dashboard/vehicles/{vehicleId}` vehicle payload — extends the
 * #14 list DTO with detail-only fields. `photoUrls[0]` is the main photo, the
 * rest are thumbnails (PM AC4). `lastInspectedAt`/numeric fields are
 * nullable — the UI renders `NO_VALUE_PLACEHOLDER` instead of an empty string.
 */
export interface VehicleDetailDto extends VehicleDto {
  photoUrls: string[];
  options: string[];
  totalMileageKm: number;
  lastInspectedAt: string | null;
}

export type WheelPosition = "FL" | "FR" | "RL" | "RR";

export const WHEEL_POSITIONS: readonly WheelPosition[] = [
  "FL",
  "FR",
  "RL",
  "RR",
] as const;

export function isWheelPosition(value: unknown): value is WheelPosition {
  return (
    typeof value === "string" &&
    (WHEEL_POSITIONS as readonly string[]).includes(value)
  );
}

/**
 * One wheel's tire detail (PM AC16/AC17). `status` (not the raw measurements)
 * is the single source of truth for the "needs attention" visual highlight —
 * Figma's FL sample has normal-looking numbers under a CAUTION overlay, which
 * `.claude/handoffs/15-figma-specs.md` "Discovered Mock Inconsistencies"
 * resolves by always deriving color/highlight from `status`, never from the
 * measurement values.
 *
 * `expectedReplacementAt` is named like an ISO date in `15-api-specs.md`, but
 * that handoff groups it together with the other nullable *numeric* fields
 * and Figma's confirmed copy is "예상 교체 시점 약 8,400km" (a distance, not a
 * date) — treated here as a nullable km distance to match the confirmed
 * Figma display fact; TODO(#15) reconcile the literal field name/semantics
 * once the real backend contract is confirmed.
 */
export interface TireDetail {
  position: WheelPosition;
  status: TireStatus;
  expectedReplacementAt: number | null;
  pressureKpa: number | null;
  temperatureCelsius: number | null;
  alignmentDeg: number | null;
  treadDepthMm: number | null;
}

export type TireTrendMetric = "PRESSURE" | "TEMPERATURE" | "ALIGNMENT" | "WEAR";

export const TIRE_TREND_METRICS: readonly TireTrendMetric[] = [
  "PRESSURE",
  "TEMPERATURE",
  "ALIGNMENT",
  "WEAR",
] as const;

export function isTireTrendMetric(value: unknown): value is TireTrendMetric {
  return (
    typeof value === "string" &&
    (TIRE_TREND_METRICS as readonly string[]).includes(value)
  );
}

/** One point on the 4-line (FL/FR/RL/RR) tire trend chart for a single metric. */
export interface TireTrendPoint {
  date: string;
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
}

/** `GET /api/dashboard/vehicles/{vehicleId}` bundled reservation payload (`content.reservation`, nullable). */
export interface ReservationSummaryDto {
  reservationId: string;
  renterName: string;
  startAt: string;
  returnAt: string;
}

/**
 * UI model — adds `daysUntilReturn`. Computed by a pure function that takes
 * `now` as an explicit parameter (never calls `new Date()` internally); only
 * the render-time caller supplies `now` (PM Scope, "new Date() 직접 호출 금지").
 */
export interface ReservationSummary extends ReservationSummaryDto {
  daysUntilReturn: number;
}

/** `GET /api/dashboard/vehicles/{vehicleId}/alerts` item. `tirePosition` is null for non-tire alerts. */
export interface AlertHistoryItem {
  id: string;
  tirePosition: WheelPosition | null;
  message: string;
  occurredAt: string;
}

/** `GET /api/dashboard/vehicles/{vehicleId}/usage-history` item (PM AC19). */
export interface UsageHistoryItem {
  id: string;
  renterName: string;
  renterPhone: string;
  rentedAt: string;
  returnedAt: string | null;
  mileageKm: number;
  alertCount: number;
}

/** 1-based page metadata, `pageSize` fixed at 8 (PM AC19). */
export interface PageInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** `{statusCode, error, content}` envelope (provisional, following the #14 precedent). */
export interface VehicleDetailResponse {
  statusCode: number;
  error: string | null;
  content: {
    vehicle: VehicleDetailDto;
    reservation: ReservationSummaryDto | null;
  };
}

export interface VehicleAlertHistoryResponse {
  statusCode: number;
  error: string | null;
  content: {
    alerts: AlertHistoryItem[];
  };
}

export interface VehicleUsageHistoryResponse {
  statusCode: number;
  error: string | null;
  content: {
    items: UsageHistoryItem[];
    pageInfo: PageInfo;
  };
}

/** Always exactly 4 entries (one per {@link WheelPosition}), PM Scope. */
export interface VehicleTireDetailResponse {
  statusCode: number;
  error: string | null;
  content: {
    tires: TireDetail[];
  };
}

export interface VehicleTireTrendResponse {
  statusCode: number;
  error: string | null;
  content: {
    metric: TireTrendMetric;
    points: TireTrendPoint[];
  };
}
