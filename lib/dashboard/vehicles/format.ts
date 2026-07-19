import type {
  FuelType,
  TireStatus,
  TireTrendMetric,
  VehicleOption,
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

/**
 * `업데이트 시간 : YY/MM/DD HH:mm` label for the vehicle list's `content.refreshedAt`
 * (issue #35, Figma literal copy `"업데이트 시간 : 26/07/08 20:41"`). Unlike
 * {@link formatVehicleListDateLabel} (date-only, UTC getters chosen so the
 * label never day-shifts across timezones), this label includes hour:minute
 * and is meant to read as "how long ago did I refresh", so it must reflect
 * the admin's actual local wall-clock time — local-time getters are used
 * here intentionally (PM handoff Assumption A3).
 */
export function formatVehicleListRefreshedAtLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return `업데이트 시간 : ${NO_VALUE_PLACEHOLDER}`;
  }

  const yy = (date.getFullYear() % 100).toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `업데이트 시간 : ${yy}/${mm}/${dd} ${hh}:${min}`;
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

// ---------------------------------------------------------------------------
// Issue #42 — Car Info panel-only label maps (additive). These are distinct
// from `formatFuelTypeLabel`/`formatVehicleTypeLabel` above (which stay
// unchanged and are shared with other screens) — the Car Info panel's
// confirmed copy ("가솔린차" etc.) differs from the shared fuel label
// ("가솔린" etc.), so a second map is used instead of changing the shared one.
// ---------------------------------------------------------------------------

const VEHICLE_INFO_FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: "가솔린차",
  DIESEL: "디젤차",
  HYBRID: "하이브리드차",
  ELECTRIC: "전기차",
};

/** Car Info panel-only fuel label (PM confirmed copy, issue #42) — never used outside `VehicleInfoPanel`. */
export function formatVehicleInfoFuelTypeLabel(type: FuelType): string {
  return VEHICLE_INFO_FUEL_TYPE_LABELS[type];
}

const VEHICLE_OPTION_LABELS: Record<VehicleOption, string> = {
  NAVIGATION: "내비게이션",
  HIPASS: "하이패스",
  BLACKBOX: "블랙박스",
  HEATED_SEAT: "열선 시트",
  SMART_KEY: "스마트키",
  SUNROOF: "선루프",
  VENTILATED_SEAT: "통풍 시트",
  REAR_CAMERA: "후방 카메라",
};

/** Car Info panel option chip label (PM confirmed copy, issue #42). */
export function formatVehicleOptionLabel(option: VehicleOption): string {
  return VEHICLE_OPTION_LABELS[option];
}
