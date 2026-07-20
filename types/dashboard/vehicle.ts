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
// TODO(#15): the tire-detail payload further below is still provisional
// (`.claude/handoffs/15-api-specs.md` "Contract status") — re-verify field
// names/units/envelope shape once the real backend contract for that endpoint
// is confirmed. Tire-trend (`GET /api/vehicles/{vehicleId}/tires/trend`) is
// confirmed against the real OpenAPI `getTireTrend` contract.
//
// `VehicleDetailDto`/`VehicleDetailResponse` (the "차량 정보" panel),
// `CurrentRental`/`CurrentRentalResponse` (the "예약 내역" panel),
// `AlertHistoryItem`/`VehicleAlertHistoryResponse` (the "알림 이력" panel), and
// `RentalHistoryItem`/`VehicleRentalHistoryResponse` (the "이용 이력" panel)
// below are NOT part of that TODO — all four are confirmed against the real
// backend contract as of issue #42 (`.claude/handoffs/42-api-specs.md`),
// issue #47 (`.claude/handoffs/47-api-specs.md`), and issue #49
// (`.claude/handoffs/49-api-specs.md`), replacing the #15 provisional
// `VehicleDetailDto extends VehicleDto` / `ReservationSummaryDto` /
// `id`/`tirePosition`/`message`/`occurredAt` / `UsageHistoryItem`
// (`id`/`renterPhone`/`rentedAt`/`returnedAt`/`mileageKm`, single-level
// `content.items`/`content.pageInfo`) shapes entirely (breaking change).
// ---------------------------------------------------------------------------

export type VehicleOption =
  | "BLACKBOX"
  | "REAR_CAMERA"
  | "SUNROOF"
  | "NAVIGATION"
  | "HIPASS"
  | "HEATED_SEAT"
  | "VENTILATED_SEAT"
  | "SMART_KEY";

export const VEHICLE_OPTIONS: readonly VehicleOption[] = [
  "BLACKBOX",
  "REAR_CAMERA",
  "SUNROOF",
  "NAVIGATION",
  "HIPASS",
  "HEATED_SEAT",
  "VENTILATED_SEAT",
  "SMART_KEY",
] as const;

export function isVehicleOption(value: unknown): value is VehicleOption {
  return (
    typeof value === "string" &&
    (VEHICLE_OPTIONS as readonly string[]).includes(value)
  );
}

/**
 * `GET /api/dashboard/vehicles/{vehicleId}` vehicle payload (issue #42,
 * confirmed real backend contract) — standalone, no relation to the #14 list
 * `VehicleDto` (breaking change from the #15 provisional
 * `VehicleDetailDto extends VehicleDto`). `imageUrls[0]` is the main photo,
 * the rest are thumbnails (PM display rule); an empty `imageUrls` renders a
 * standard empty-state placeholder. `options` is a variable-length, unique
 * array of the 8 confirmed enum codes. `tireStatus` is non-null here, unlike
 * the list `VehicleDto.tireStatus`, which is nullable.
 */
export interface VehicleDetailDto {
  vehicleId: string;
  imageUrls: string[];
  plateNumber: string;
  manufacturer: string;
  model: string;
  modelCode: string;
  modelYear: number;
  vehicleType: VehicleType;
  fuelType: FuelType;
  options: VehicleOption[];
  mileage: number;
  lastInspectedAt: string; // "YYYY-MM-DD"
  tireStatus: TireStatus;
}

/**
 * `{statusCode, error, content}` envelope — `content` is the vehicle payload
 * directly, with no `vehicle`/`reservation` wrapping (issue #42, breaking
 * change from the #15 provisional `{ vehicle, reservation }` shape below,
 * which this replaces).
 */
export interface VehicleDetailResponse {
  statusCode: number;
  error: string | null;
  content: VehicleDetailDto;
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

/** Wire field on each tire for a given UI metric (`getTireTrend`). */
export type TireTrendSeriesKey =
  | "pressure"
  | "temperature"
  | "wheelAlignment"
  | "wearLevel";

export const TIRE_TREND_METRIC_SERIES: Record<TireTrendMetric, TireTrendSeriesKey> = {
  PRESSURE: "pressure",
  TEMPERATURE: "temperature",
  ALIGNMENT: "wheelAlignment",
  WEAR: "wearLevel",
};

/** One daily average point on a per-tire metric series (`DailyPoint` in OpenAPI). */
export interface TireTrendDailyPoint {
  date: string; // "YYYY-MM-DD"
  value: number | null;
}

/**
 * One tire's trend payload from `GET /api/vehicles/{vehicleId}/tires/trend`
 * (`TireTrend` in OpenAPI). All four metric series are returned together;
 * the UI picks one series client-side via {@link TireTrendMetric}.
 */
export interface TireTrendTire {
  tireId: string;
  position: WheelPosition;
  pressure: TireTrendDailyPoint[];
  temperature: TireTrendDailyPoint[];
  wheelAlignment: TireTrendDailyPoint[];
  wearLevel: TireTrendDailyPoint[];
}

/** One point on the 4-line (FL/FR/RL/RR) tire trend chart for a single metric. */
export interface TireTrendPoint {
  date: string;
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
}

/**
 * `GET /api/dashboard/vehicles/{vehicleId}/current-rental` (issue #42, new
 * endpoint, confirmed contract) — completely separate from
 * {@link VehicleDetailResponse} above (no bundled `reservation` field
 * anymore; replaces the #15 provisional `ReservationSummaryDto`/
 * `ReservationSummary`, both removed). `startDate`/`endDate` are KST
 * wall-clock strings in `"YYYY.MM.DD HH:mm:ss"` format — not ISO, no
 * timezone suffix — see `lib/dashboard/vehicles/current-rental-api.ts`
 * `parseKstDateTime`.
 */
export type CurrentRental =
  | { rented: true; renterName: string; startDate: string; endDate: string }
  | { rented: false };

export interface CurrentRentalResponse {
  statusCode: number;
  error: string | null;
  content: CurrentRental;
}

export type AlertLevel = "WARNING" | "DANGER";

export const ALERT_LEVELS: readonly AlertLevel[] = ["WARNING", "DANGER"] as const;

export function isAlertLevel(value: unknown): value is AlertLevel {
  return (
    typeof value === "string" && (ALERT_LEVELS as readonly string[]).includes(value)
  );
}

/**
 * `GET /api/dashboard/vehicles/{vehicleId}/alerts` item (issue #47, confirmed
 * real backend contract — replaces the #15 provisional
 * `id`/`tirePosition`/`message`/`occurredAt` shape entirely, breaking
 * change). `position` is non-null (unlike the removed `tirePosition`).
 * `alertLevel` is validated but never rendered (PM Scope: "alertLevel 미표시").
 */
export interface AlertHistoryItem {
  alertId: string;
  tireId: string;
  position: WheelPosition;
  alertLevel: AlertLevel;
  alertTitle: string;
  alertTime: string;
}

/** `{statusCode, error, content}` envelope — `content` is the array directly (issue #47, no `alerts` wrapping). */
export interface VehicleAlertHistoryResponse {
  statusCode: number;
  error: string | null;
  content: AlertHistoryItem[];
}

export type RentalStatus = "RESERVED" | "IN_PROGRESS" | "RETURNED";

export const RENTAL_STATUSES: readonly RentalStatus[] = [
  "RESERVED",
  "IN_PROGRESS",
  "RETURNED",
] as const;

export function isRentalStatus(value: unknown): value is RentalStatus {
  return (
    typeof value === "string" &&
    (RENTAL_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * `GET /api/dashboard/vehicles/{vehicleId}/rentals` item (issue #49,
 * confirmed real backend contract — replaces the #15 provisional
 * `id`/`renterPhone`/`rentedAt`/`returnedAt`/`mileageKm` shape entirely,
 * breaking change). `startDate`/`endDate` are KST wall-clock wire strings in
 * `"YYYY.MM.DD HH:mm:ss"` format (not ISO, no timezone suffix). `status`/
 * `startDate`/`endDate` are validated but never rendered (PM Scope: "status는
 * 화면 어디에도 렌더하지 않는다"). `alertCount` is `number | null` (PM A4);
 * `reportDownloadUrl` is `string | null` — `null` hides the report link
 * entirely (PM display rule).
 */
export interface RentalHistoryItem {
  rentalId: string;
  renterName: string;
  contact: string;
  status: RentalStatus;
  startDate: string;
  endDate: string;
  rentalMinutes: number;
  distanceKm: number;
  alertCount: number | null;
  reportDownloadUrl: string | null;
}

/**
 * 1-based page metadata surfaced to the UI, derived from the 0-based
 * `content.page` returned by the backend (PM A1, issue #49). `pageSize` is
 * fixed at 8.
 */
export interface RentalHistoryPageInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * `{statusCode, error, content}` envelope with a *nested* page wrapper —
 * `content.content` is the item array, page metadata (`page`/`size`/
 * `totalPages`/`totalElements`) are sibling fields on the same `content`
 * object (issue #49 confirmed contract — distinct from the #15 provisional
 * single-level `content.items`/`content.pageInfo` shape it replaces).
 */
export interface VehicleRentalHistoryResponse {
  statusCode: number;
  error: string | null;
  content: {
    content: RentalHistoryItem[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
}

/**
 * 실제 백엔드 `GET /api/vehicles/{id}/tires` 한 바퀴 응답(`TireResponse`). `content`는
 * 이 DTO 4개의 배열이다(봉투 안에 별도 `tires` 필드 없음). `status`는 앱이 저장한 바퀴별
 * 종합 상태이며, 구버전 백엔드 호환을 위해 파서에서는 누락 시 NORMAL로 처리한다.
 * `expectedReplacementKm`은 마모도 기반 잔여 km((100-wear)/100×40000).
 */
export interface TireDetailBackendDto {
  tireId?: string;
  position: WheelPosition;
  status: TireStatus;
  pressure: number | null;
  temperature: number | null;
  alignment: number | null;
  wearLevel: number | null;
  friction?: number | null;
  expectedReplacementKm?: number | null;
}

/** Always exactly 4 entries (one per {@link WheelPosition}), PM Scope. */
export interface VehicleTireDetailResponse {
  statusCode: number;
  error: string | null;
  content: TireDetailBackendDto[];
}

/**
 * `GET /api/vehicles/{vehicleId}/tires/trend?graphDays=` envelope
 * (`ApiResponseTireTrendResponse` / `TireTrendResponse` in OpenAPI).
 */
export interface VehicleTireTrendResponse {
  statusCode: number;
  error: string | null;
  content: {
    tires: TireTrendTire[];
  };
}
