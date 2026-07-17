import type {
  FuelType,
  TireStatus,
  TireTrendMetric,
  VehicleType,
  WheelPosition,
} from "@/types/dashboard/vehicle";

/**
 * Explicit placeholder for a null `tireStatus`/`rentedAt`/`returnedAt`
 * (PM AC1, `.claude/handoffs/14-pm-breakdown.md`) — never an empty string, so
 * a missing value can't be mistaken for silent/empty rendering.
 */
export const NO_VALUE_PLACEHOLDER = "—";

const TIRE_STATUS_LABELS: Record<TireStatus, string> = {
  NORMAL: "정상",
  CAUTION: "주의",
  WARNING: "위험",
};

export function formatTireStatusLabel(tireStatus: TireStatus | null): string {
  return tireStatus ? TIRE_STATUS_LABELS[tireStatus] : NO_VALUE_PLACEHOLDER;
}

/**
 * `YYYY.MM.DD` display format (CLAUDE.md §4); the transmitted/fixture value
 * stays the original ISO string (adapter never rewrites it). UTC getters are
 * used (not local-time getters) so the rendered date does not shift by a day
 * depending on the machine/CI timezone running the code.
 */
export function formatVehicleDateLabel(iso: string | null): string {
  if (!iso) return NO_VALUE_PLACEHOLDER;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_VALUE_PLACEHOLDER;

  const yyyy = date.getUTCFullYear().toString().padStart(4, "0");
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

/**
 * `YY.MM.DD` display format for the `/dashboard/vehicles` list table only
 * (issue #33, user-confirmed override of the CLAUDE.md §4 default
 * `YYYY.MM.DD` for this one screen). {@link formatVehicleDateLabel}
 * (`YYYY.MM.DD`) is unchanged and stays the format used by the #15 detail
 * screen and every other consumer — only `VehicleTable.tsx` uses this
 * function. UTC getters avoid a timezone-dependent day shift.
 */
export function formatVehicleListDateLabel(iso: string | null): string {
  if (!iso) return NO_VALUE_PLACEHOLDER;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_VALUE_PLACEHOLDER;

  const yy = (date.getUTCFullYear() % 100).toString().padStart(2, "0");
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

// ---------------------------------------------------------------------------
// Issue #15 — vehicle detail screen formatters (additive).
// ---------------------------------------------------------------------------

const WHEEL_POSITION_LABELS: Record<WheelPosition, string> = {
  FL: "전좌",
  FR: "전우",
  RL: "후좌",
  RR: "후우",
};

export function formatWheelPositionLabel(position: WheelPosition): string {
  return WHEEL_POSITION_LABELS[position];
}

const TIRE_TREND_METRIC_LABELS: Record<TireTrendMetric, string> = {
  PRESSURE: "공기압",
  TEMPERATURE: "온도",
  ALIGNMENT: "휠 얼라이먼트",
  WEAR: "마모도",
};

export function formatTireTrendMetricLabel(metric: TireTrendMetric): string {
  return TIRE_TREND_METRIC_LABELS[metric];
}

/**
 * Nullable-number formatters for the 5 tire card fields (PM AC16). Units
 * follow the confirmed Figma copy (`.claude/handoffs/15-figma-specs.md`
 * Confirmed Design Facts #3), independent of the provisional field name/type
 * used internally (see `TireDetail` TSDoc, `types/dashboard/vehicle.ts`).
 */
export function formatExpectedReplacementLabel(km: number | null): string {
  return km === null ? NO_VALUE_PLACEHOLDER : `약 ${km.toLocaleString("ko-KR")}km`;
}

export function formatPressureLabel(kpa: number | null): string {
  return kpa === null ? NO_VALUE_PLACEHOLDER : `${kpa} psi`;
}

export function formatTemperatureLabel(celsius: number | null): string {
  return celsius === null ? NO_VALUE_PLACEHOLDER : `${celsius}℃`;
}

export function formatAlignmentLabel(deg: number | null): string {
  return deg === null ? NO_VALUE_PLACEHOLDER : `${deg}°`;
}

export function formatWearLabel(percent: number | null): string {
  return percent === null ? NO_VALUE_PLACEHOLDER : `${percent}%`;
}

/**
 * `vehicleType`/`fuelType` labels (PM AC4). `#14`'s `VehicleTable` never
 * rendered these fields (PM Decision 8, `.claude/handoffs/14-pm-breakdown.md`
 * — no dedicated Figma column), so no label mapping existed yet; the detail
 * screen's Car Info panel does need them.
 */
const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SEDAN: "세단",
  SUV: "SUV",
  HATCHBACK: "해치백",
};

export function formatVehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_LABELS[type];
}

const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: "가솔린",
  DIESEL: "디젤",
  HYBRID: "하이브리드",
  ELECTRIC: "전기",
};

export function formatFuelTypeLabel(type: FuelType): string {
  return FUEL_TYPE_LABELS[type];
}
