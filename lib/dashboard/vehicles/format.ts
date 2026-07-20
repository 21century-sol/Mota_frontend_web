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
 * Compact `M.D` axis label for the tire trend chart (Figma node 1:14009,
 * e.g. `7.12`). Accepts wire `YYYY-MM-DD` or any Date-parsable string; uses
 * UTC getters so CI/local timezone cannot shift the calendar day.
 */
export function formatTireTrendDateLabel(iso: string | null): string {
  if (!iso) return NO_VALUE_PLACEHOLDER;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_VALUE_PLACEHOLDER;

  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${month}.${day}`;
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

// ---------------------------------------------------------------------------
// Issue #47 — "알림 이력" panel time formatter (additive).
// ---------------------------------------------------------------------------

/**
 * Thrown when a value passed to {@link formatKstWireDateTimeLabel} doesn't
 * match the "YYYY.MM.DD HH:mm:ss" KST wire format (issue #47). A local error
 * class distinct from `alert-history-api.ts`'s
 * `VehicleAlertHistoryContractMismatchError` so this pure formatter has no
 * dependency on the adapter module (PM/API handoff design freedom,
 * `.claude/handoffs/47-api-specs.md` "Non-blocking Design Notes").
 */
export class AlertHistoryTimeFormatError extends Error {
  constructor(reason: string) {
    super(`Alert history time format mismatch: ${reason}`);
    this.name = "AlertHistoryTimeFormatError";
  }
}

/**
 * "YYYY.MM.DD HH:mm:ss" — KST wall-clock wire format (not ISO, no timezone
 * suffix). Locally re-defined (not imported from `current-rental-api.ts`'s
 * module-private same-named pattern, nor from `alert-history-api.ts`'s own
 * copy) — PM handoff Assumption A1, `.claude/handoffs/47-pm.md`.
 */
const WIRE_DATETIME_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

/**
 * `"YYYY.MM.DD HH:mm:ss"` KST wire string → `"YYYY.MM.DD 오전/오후 HH:mm"`
 * display label (issue #47 AC6). Uses the regex match groups directly
 * (`hour`/`minute`) instead of round-tripping through a `Date` — same
 * approach as `current-rental-api.ts`'s `formatKstWireDateLabel` — so the
 * result never shifts with the host timezone.
 *
 * `hour < 12` → "오전", `hour >= 12` → "오후"; `displayHour = hour % 12 === 0
 * ? 12 : hour % 12`, always 2-digit zero-padded. Examples: "11:00:00" →
 * "오전 11:00", "14:30:00" → "오후 02:30", "00:07:00" → "오전 12:07",
 * "12:00:00" → "오후 12:00".
 */
export function formatKstWireDateTimeLabel(wireValue: string): string {
  const match = WIRE_DATETIME_PATTERN.exec(wireValue);
  if (!match) {
    throw new AlertHistoryTimeFormatError(
      `date value "${wireValue}" does not match the "YYYY.MM.DD HH:mm:ss" wire format`,
    );
  }
  const [, year, month, day, hourStr, minuteStr] = match;
  const hour = Number(hourStr);
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const hh = displayHour.toString().padStart(2, "0");
  return `${year}.${month}.${day} ${period} ${hh}:${minuteStr}`;
}

// ---------------------------------------------------------------------------
// Issue #49 — "이용 이력" panel formatters (additive). `rentalMinutes`/
// `distanceKm`/`alertCount` display rules are PM-confirmed (`.claude/handoffs/49-pm.md`
// "표시 규칙") and intentionally do not round or localize the raw numbers —
// unlike e.g. `formatExpectedReplacementLabel`'s `toLocaleString`, a 0 or a
// >24h duration must render literally ("0시간 0분", "81시간 0분") rather than
// being clamped or reformatted.
// ---------------------------------------------------------------------------

/**
 * `rentalMinutes` (int, minutes) → `"{h}시간 {m}분"`. `h = Math.floor(min/60)`,
 * `m = min % 60` — no rounding, no day/hour clamping, so a 0-minute rental
 * reads "0시간 0분" and a >24h rental (e.g. 4860 → 81시간 0분) still reads as
 * hours, never days (PM display rule, issue #49 AC5).
 */
export function formatRentalDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainderMinutes = minutes % 60;
  return `${hours}시간 ${remainderMinutes}분`;
}

/**
 * `distanceKm` (double) → `"{km}km"`, the raw decimal value unchanged (no
 * rounding/formatting) — e.g. 312.5 → "312.5km" (PM display rule, issue #49
 * AC6).
 */
export function formatDistanceKmLabel(km: number): string {
  return `${km}km`;
}

/**
 * `alertCount` (`number | null`) → `""` for `null`/`0`, `"{n}건"` otherwise
 * (PM display rule, issue #49 AC7) — a 0-alert row renders an empty cell
 * rather than the literal "0건".
 */
export function formatAlertCountLabel(count: number | null): string {
  return count === null || count === 0 ? "" : `${count}건`;
}
