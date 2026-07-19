import type {
  AlertHistoryItem,
  CurrentRental,
  CurrentRentalResponse,
  PageInfo,
  ReservationSummaryDto,
  TireDetail,
  TireStatus,
  TireTrendMetric,
  TireTrendPoint,
  UsageHistoryItem,
  VehicleAlertHistoryResponse,
  VehicleDetailDto,
  VehicleDetailResponse,
  VehicleDto,
  VehicleManagementListResponse,
  VehicleManagementStatus,
  VehicleTireDetailResponse,
  VehicleTireTrendResponse,
  VehicleUsageHistoryResponse,
} from "@/types/dashboard/vehicle";

/**
 * Normal scenario (12 vehicles): `status` AVAILABLE×5 / RENTED×4 / REPAIR×3,
 * `tireStatus` mixes NORMAL/CAUTION/WARNING/null, and `rentedAt`/`returnedAt`
 * mix populated/null combinations (PM AC1 null-placeholder coverage). Plate
 * numbers/models are synthetic Korean rental-car data (CLAUDE.md §6).
 *
 * Deliberately no `REPAIR` + `tireStatus: "NORMAL"` entry — `vehiclesFilteredEmptyHandler`
 * relies on that combination being empty (`.claude/handoffs/14-api-specs.md`).
 *
 * `imageUrl` values are synthetic backend-style URLs (not real images) — the
 * real thumbnail asset is unconfirmed (Figma "Assets/Icons": all 5 sample rows
 * share one placeholder-looking image). `VehicleThumbnail` renders an icon
 * fallback if the URL fails to load, so this is not a blocking placeholder.
 */
export const vehiclesNormalFixture: VehicleDto[] = [
  {
    vehicleId: "vehicle-mgmt-001",
    plateNumber: "12가 3456",
    model: "아반떼 하이브리드",
    modelYear: 2022,
    manufacturer: "현대",
    vehicleType: "SEDAN",
    fuelType: "HYBRID",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-001.jpg",
    status: "AVAILABLE",
    tireStatus: "NORMAL",
    rentedAt: null,
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-002",
    plateNumber: "34나 5678",
    model: "쏘나타",
    modelYear: 2021,
    manufacturer: "현대",
    vehicleType: "SEDAN",
    fuelType: "GASOLINE",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-002.jpg",
    status: "AVAILABLE",
    tireStatus: "CAUTION",
    rentedAt: null,
    returnedAt: "2026-06-01T02:00:00.000Z",
  },
  {
    vehicleId: "vehicle-mgmt-003",
    plateNumber: "56다 1234",
    model: "투싼",
    modelYear: 2023,
    manufacturer: "현대",
    vehicleType: "SUV",
    fuelType: "DIESEL",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-003.jpg",
    status: "AVAILABLE",
    tireStatus: "WARNING",
    rentedAt: null,
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-004",
    plateNumber: "78라 4321",
    model: "모닝",
    modelYear: 2020,
    manufacturer: "기아",
    vehicleType: "HATCHBACK",
    fuelType: "GASOLINE",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-004.jpg",
    status: "AVAILABLE",
    tireStatus: null,
    rentedAt: null,
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-005",
    plateNumber: "90마 8765",
    model: "레이",
    modelYear: 2022,
    manufacturer: "기아",
    vehicleType: "HATCHBACK",
    fuelType: "GASOLINE",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-005.jpg",
    status: "AVAILABLE",
    tireStatus: "NORMAL",
    rentedAt: null,
    returnedAt: "2026-05-10T05:30:00.000Z",
  },
  {
    vehicleId: "vehicle-mgmt-006",
    plateNumber: "11바 1111",
    model: "K5",
    modelYear: 2023,
    manufacturer: "기아",
    vehicleType: "SEDAN",
    fuelType: "GASOLINE",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-006.jpg",
    status: "RENTED",
    tireStatus: "NORMAL",
    rentedAt: "2026-07-01T01:00:00.000Z",
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-007",
    plateNumber: "22사 2222",
    model: "스포티지",
    modelYear: 2022,
    manufacturer: "기아",
    vehicleType: "SUV",
    fuelType: "DIESEL",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-007.jpg",
    status: "RENTED",
    tireStatus: "CAUTION",
    rentedAt: "2026-07-05T04:00:00.000Z",
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-008",
    plateNumber: "33아 3333",
    model: "셀토스",
    modelYear: 2021,
    manufacturer: "기아",
    vehicleType: "SUV",
    fuelType: "GASOLINE",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-008.jpg",
    status: "RENTED",
    tireStatus: "WARNING",
    rentedAt: "2026-06-20T08:00:00.000Z",
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-009",
    plateNumber: "44자 4444",
    model: "아이오닉5",
    modelYear: 2023,
    manufacturer: "현대",
    vehicleType: "SUV",
    fuelType: "ELECTRIC",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-009.jpg",
    status: "RENTED",
    tireStatus: null,
    rentedAt: "2026-07-10T00:00:00.000Z",
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-010",
    plateNumber: "55차 5555",
    model: "그랜저",
    modelYear: 2020,
    manufacturer: "현대",
    vehicleType: "SEDAN",
    fuelType: "GASOLINE",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-010.jpg",
    status: "REPAIR",
    tireStatus: "WARNING",
    rentedAt: "2026-05-01T01:00:00.000Z",
    returnedAt: "2026-06-01T03:00:00.000Z",
  },
  {
    vehicleId: "vehicle-mgmt-011",
    plateNumber: "66카 6666",
    model: "팰리세이드",
    modelYear: 2022,
    manufacturer: "현대",
    vehicleType: "SUV",
    fuelType: "DIESEL",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-011.jpg",
    status: "REPAIR",
    tireStatus: "CAUTION",
    rentedAt: null,
    returnedAt: null,
  },
  {
    vehicleId: "vehicle-mgmt-012",
    plateNumber: "77타 7777",
    model: "카니발",
    modelYear: 2021,
    manufacturer: "기아",
    vehicleType: "SUV",
    fuelType: "DIESEL",
    imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-012.jpg",
    status: "REPAIR",
    tireStatus: "CAUTION",
    rentedAt: "2026-04-15T01:00:00.000Z",
    returnedAt: "2026-04-20T02:00:00.000Z",
  },
] satisfies VehicleDto[];

/** Empty scenario (AC3 — 0 registered vehicles, distinct from a filtered 0-result). */
export const vehiclesEmptyFixture: VehicleDto[] = [] satisfies VehicleDto[];

const FIXED_REFRESHED_AT = "2026-07-16T10:00:00.000Z";

/**
 * Mirrors the real endpoint's AND semantics (`.claude/handoffs/14-api-specs.md`)
 * so `vehiclesNormalHandler` and `vehiclesFilteredEmptyHandler` share one
 * implementation instead of two independently-maintained fixture lists.
 *
 * `filters` is intentionally the single-value shape the real backend query
 * actually accepts (`status`/`tireStatus` each 0-or-1 value), not the
 * client-side `VehicleListFilters` (issue #35 multi-select `tireStatus:
 * TireStatus[]`) — this fixture only ever needs to emulate the server, which
 * this handler's caller (`readFiltersFromUrl`,
 * `lib/dashboard/msw/handlers/vehicles.ts`) already narrows down to before
 * calling here.
 */
export function filterVehicleFixture(
  vehicles: VehicleDto[],
  filters: { status?: VehicleManagementStatus; tireStatus?: TireStatus },
): VehicleDto[] {
  return vehicles.filter((vehicle) => {
    if (filters.status && vehicle.status !== filters.status) return false;
    if (filters.tireStatus && vehicle.tireStatus !== filters.tireStatus) {
      return false;
    }
    return true;
  });
}

export function toVehicleManagementListResponse(
  vehicles: VehicleDto[],
): VehicleManagementListResponse {
  return {
    statusCode: 200,
    error: null,
    content: {
      refreshedAt: FIXED_REFRESHED_AT,
      vehicles,
    },
  };
}

// ---------------------------------------------------------------------------
// Issue #15 — `/dashboard/vehicles/[vehicleId]` detail-screen fixtures.
//
// 4 of the 12 list vehicles above get a full detail fixture set (`.claude/handoffs/15-api-specs.md`
// fixture table): vehicle-mgmt-001 (all-normal), -003 (WARNING+CAUTION,
// paginated usage), -004 (null-value coverage, empty usage/alerts), -007
// (CAUTION-only boundary). `VEHICLE_DETAIL_NOT_FOUND_ID` is a 5th id that is
// deliberately absent from every fixture map below (AC6).
// ---------------------------------------------------------------------------

export const VEHICLE_DETAIL_NOT_FOUND_ID = "vehicle-mgmt-999";

function findListFixture(vehicleId: string): VehicleDto {
  const found = vehiclesNormalFixture.find((vehicle) => vehicle.vehicleId === vehicleId);
  if (!found) {
    throw new Error(`fixtures/vehicles.ts: no list fixture entry for ${vehicleId}`);
  }
  return found;
}

function toDetailDto(
  vehicleId: string,
  overrides: Pick<
    VehicleDetailDto,
    "photoUrls" | "options" | "totalMileageKm" | "lastInspectedAt"
  >,
): VehicleDetailDto {
  return { ...findListFixture(vehicleId), ...overrides };
}

/** Distinct per-index URL (not one repeated constant) so React list keys in `VehicleInfoPanel` stay unique. */
function placeholderPhotos(vehicleId: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) =>
      `https://mota-app.duckdns.org/uploads/vehicles/${vehicleId}-detail-${index + 1}.jpg`,
  );
}

export const vehicleDetailFixturesById: Record<string, VehicleDetailDto> = {
  "vehicle-mgmt-001": toDetailDto("vehicle-mgmt-001", {
    photoUrls: placeholderPhotos("vehicle-mgmt-001", 3),
    options: ["네비게이션", "후방카메라", "하이패스"],
    totalMileageKm: 15230,
    lastInspectedAt: "2026-06-01T00:00:00.000Z",
  }),
  "vehicle-mgmt-003": toDetailDto("vehicle-mgmt-003", {
    photoUrls: placeholderPhotos("vehicle-mgmt-003", 2),
    options: ["네비게이션", "선루프", "통풍시트"],
    totalMileageKm: 42010,
    lastInspectedAt: "2026-05-20T00:00:00.000Z",
  }),
  "vehicle-mgmt-004": toDetailDto("vehicle-mgmt-004", {
    photoUrls: placeholderPhotos("vehicle-mgmt-004", 1),
    options: [],
    totalMileageKm: 8320,
    lastInspectedAt: null,
  }),
  "vehicle-mgmt-007": toDetailDto("vehicle-mgmt-007", {
    photoUrls: placeholderPhotos("vehicle-mgmt-007", 3),
    options: ["네비게이션", "하이패스"],
    totalMileageKm: 51200,
    lastInspectedAt: "2026-04-10T00:00:00.000Z",
  }),
} satisfies Record<string, VehicleDetailDto>;

/** `null` = no in-progress/upcoming reservation (AC9). */
export const reservationFixturesById: Record<string, ReservationSummaryDto | null> = {
  "vehicle-mgmt-001": null,
  "vehicle-mgmt-003": {
    reservationId: "reservation-003-01",
    renterName: "김민준",
    startAt: "2026-07-15T00:00:00.000Z",
    returnAt: "2026-07-20T00:00:00.000Z",
  },
  "vehicle-mgmt-004": null,
  "vehicle-mgmt-007": {
    reservationId: "reservation-007-01",
    renterName: "이서연",
    startAt: "2026-07-05T04:00:00.000Z",
    returnAt: "2026-07-18T00:00:00.000Z",
  },
} satisfies Record<string, ReservationSummaryDto | null>;

/**
 * `GET /api/dashboard/vehicles/{vehicleId}/current-rental` fixtures (issue
 * #42/#43). All wire date strings are computed by hand against a fixed
 * reference instant — `FIXED_NOW_KST = "2026.07.19 12:00:00"` (KST) — never via
 * `new Date()`, so scenario boundaries stay deterministic across test runs.
 *
 * `vehicle-mgmt-013` is a 5th id (not present in `vehicleDetailFixturesById`)
 * used only to exercise the overdue scenario — the "예약 내역" panel and its
 * `useVehicleCurrentRental` query are independent of the detail fixture set
 * (separate endpoint), so this is a valid, isolated scenario id.
 */
export const FIXED_NOW_KST = "2026.07.19 12:00:00";

export const VEHICLE_CURRENT_RENTAL_OVERDUE_ID = "vehicle-mgmt-013";

export const currentRentalFixturesById: Record<string, CurrentRental> = {
  // not-rented.
  "vehicle-mgmt-001": { rented: false },
  // over-24h: endDate = FIXED_NOW_KST + exactly 4일 → "반납까지 4일 남았습니다".
  "vehicle-mgmt-003": {
    rented: true,
    renterName: "김민준",
    startDate: "2026.07.15 09:00:00",
    endDate: "2026.07.23 12:00:00",
  },
  // 1-to-24h: endDate = FIXED_NOW_KST + exactly 5시간 → "반납까지 5시간 남았습니다".
  "vehicle-mgmt-004": {
    rented: true,
    renterName: "이서연",
    startDate: "2026.07.18 09:00:00",
    endDate: "2026.07.19 17:00:00",
  },
  // under-1h: endDate = FIXED_NOW_KST + exactly 20분 → "반납까지 20분 남았습니다".
  "vehicle-mgmt-007": {
    rented: true,
    renterName: "박지호",
    startDate: "2026.07.19 08:00:00",
    endDate: "2026.07.19 12:20:00",
  },
  // overdue: endDate = FIXED_NOW_KST - 2시간 (already in the past) → "반납 예정 시간이 지났습니다".
  [VEHICLE_CURRENT_RENTAL_OVERDUE_ID]: {
    rented: true,
    renterName: "최유진",
    startDate: "2026.07.16 09:00:00",
    endDate: "2026.07.19 10:00:00",
  },
} satisfies Record<string, CurrentRental>;

export const alertHistoryFixturesById: Record<string, AlertHistoryItem[]> = {
  "vehicle-mgmt-001": [
    {
      id: "alert-hist-001-01",
      tirePosition: null,
      message: "정기 점검이 완료되었습니다.",
      occurredAt: "2026-06-01T02:00:00.000Z",
    },
    {
      id: "alert-hist-001-02",
      tirePosition: "FR",
      message: "타이어 공기압을 점검했습니다.",
      occurredAt: "2026-06-15T05:00:00.000Z",
    },
  ],
  "vehicle-mgmt-003": [
    {
      id: "alert-hist-003-01",
      tirePosition: "FR",
      message: "공기압이 위험 수준입니다.",
      occurredAt: "2026-07-10T01:00:00.000Z",
    },
    {
      id: "alert-hist-003-02",
      tirePosition: "FL",
      message: "마모도가 주의 수준입니다.",
      occurredAt: "2026-07-08T03:00:00.000Z",
    },
    {
      id: "alert-hist-003-03",
      tirePosition: null,
      message: "정기 점검 알림이 도착했습니다.",
      occurredAt: "2026-06-20T06:00:00.000Z",
    },
  ],
  // Empty (AC11).
  "vehicle-mgmt-004": [],
  "vehicle-mgmt-007": [
    {
      id: "alert-hist-007-01",
      tirePosition: "RL",
      message: "휠 얼라이먼트 점검이 필요합니다.",
      occurredAt: "2026-07-06T02:00:00.000Z",
    },
  ],
} satisfies Record<string, AlertHistoryItem[]>;

function buildUsageHistoryItems(vehicleId: string, count: number): UsageHistoryItem[] {
  const renters: Array<{ name: string; phone: string }> = [
    { name: "박지호", phone: "010-0000-0001" },
    { name: "최유진", phone: "010-0000-0002" },
    { name: "정하윤", phone: "010-0000-0003" },
    { name: "강도현", phone: "010-0000-0004" },
    { name: "윤서준", phone: "010-0000-0005" },
    { name: "임채원", phone: "010-0000-0006" },
    { name: "한지민", phone: "010-0000-0007" },
    { name: "오승우", phone: "010-0000-0008" },
    { name: "서연우", phone: "010-0000-0009" },
    { name: "배수아", phone: "010-0000-0010" },
  ];

  return Array.from({ length: count }, (_, index) => {
    const renter = renters[index % renters.length];
    const rentedAt = new Date(Date.UTC(2026, 5, 1 + index * 3)).toISOString();
    const returnedAt = new Date(Date.UTC(2026, 5, 3 + index * 3)).toISOString();
    return {
      id: `usage-hist-${vehicleId}-${String(index + 1).padStart(2, "0")}`,
      renterName: renter.name,
      renterPhone: renter.phone,
      rentedAt,
      returnedAt,
      mileageKm: 120 + index * 37,
      alertCount: index % 3 === 0 ? 0 : (index % 3),
    } satisfies UsageHistoryItem;
  });
}

export const usageHistoryFixturesById: Record<string, UsageHistoryItem[]> = {
  "vehicle-mgmt-001": buildUsageHistoryItems("vehicle-mgmt-001", 5),
  "vehicle-mgmt-003": buildUsageHistoryItems("vehicle-mgmt-003", 10),
  // Empty (AC20).
  "vehicle-mgmt-004": [],
  "vehicle-mgmt-007": buildUsageHistoryItems("vehicle-mgmt-007", 3),
} satisfies Record<string, UsageHistoryItem[]>;

export const tireDetailFixturesById: Record<string, TireDetail[]> = {
  "vehicle-mgmt-001": [
    { position: "FL", status: "NORMAL", expectedReplacementAt: 8400, pressureKpa: 32, temperatureCelsius: 24, alignmentDeg: 0.2, treadDepthMm: 18 },
    { position: "FR", status: "NORMAL", expectedReplacementAt: 8600, pressureKpa: 32, temperatureCelsius: 24, alignmentDeg: 0.1, treadDepthMm: 19 },
    { position: "RL", status: "NORMAL", expectedReplacementAt: 9200, pressureKpa: 33, temperatureCelsius: 23, alignmentDeg: 0.2, treadDepthMm: 21 },
    { position: "RR", status: "NORMAL", expectedReplacementAt: 9100, pressureKpa: 33, temperatureCelsius: 23, alignmentDeg: 0.1, treadDepthMm: 20 },
  ],
  // FR=WARNING, FL=CAUTION (AC15 banner, AC17 highlight) — values kept consistent
  // with `status` (`.claude/handoffs/15-figma-specs.md` "Discovered Mock Inconsistencies").
  "vehicle-mgmt-003": [
    { position: "FL", status: "CAUTION", expectedReplacementAt: 2100, pressureKpa: 27, temperatureCelsius: 31, alignmentDeg: 0.9, treadDepthMm: 41 },
    { position: "FR", status: "WARNING", expectedReplacementAt: 400, pressureKpa: 19, temperatureCelsius: 38, alignmentDeg: 1.8, treadDepthMm: 68 },
    { position: "RL", status: "NORMAL", expectedReplacementAt: 8700, pressureKpa: 32, temperatureCelsius: 24, alignmentDeg: 0.1, treadDepthMm: 17 },
    { position: "RR", status: "NORMAL", expectedReplacementAt: 8500, pressureKpa: 32, temperatureCelsius: 24, alignmentDeg: 0.2, treadDepthMm: 18 },
  ],
  // Null-value coverage (AC16) — status stays NORMAL, every measurement is null.
  "vehicle-mgmt-004": [
    { position: "FL", status: "NORMAL", expectedReplacementAt: null, pressureKpa: null, temperatureCelsius: null, alignmentDeg: null, treadDepthMm: null },
    { position: "FR", status: "NORMAL", expectedReplacementAt: null, pressureKpa: null, temperatureCelsius: null, alignmentDeg: null, treadDepthMm: null },
    { position: "RL", status: "NORMAL", expectedReplacementAt: null, pressureKpa: null, temperatureCelsius: null, alignmentDeg: null, treadDepthMm: null },
    { position: "RR", status: "NORMAL", expectedReplacementAt: null, pressureKpa: null, temperatureCelsius: null, alignmentDeg: null, treadDepthMm: null },
  ],
  // CAUTION-only boundary (no WARNING) — banner still shows, all 4 highlighted with the caution color.
  "vehicle-mgmt-007": [
    { position: "FL", status: "CAUTION", expectedReplacementAt: 2500, pressureKpa: 28, temperatureCelsius: 30, alignmentDeg: 0.8, treadDepthMm: 39 },
    { position: "FR", status: "CAUTION", expectedReplacementAt: 2600, pressureKpa: 28, temperatureCelsius: 30, alignmentDeg: 0.7, treadDepthMm: 38 },
    { position: "RL", status: "CAUTION", expectedReplacementAt: 2400, pressureKpa: 27, temperatureCelsius: 31, alignmentDeg: 0.9, treadDepthMm: 40 },
    { position: "RR", status: "CAUTION", expectedReplacementAt: 2450, pressureKpa: 27, temperatureCelsius: 31, alignmentDeg: 0.8, treadDepthMm: 40 },
  ],
} satisfies Record<string, TireDetail[]>;

const TIRE_TREND_DATES = [
  "2026-06-01T00:00:00.000Z",
  "2026-06-08T00:00:00.000Z",
  "2026-06-15T00:00:00.000Z",
  "2026-06-22T00:00:00.000Z",
  "2026-06-29T00:00:00.000Z",
  "2026-07-06T00:00:00.000Z",
];

const TIRE_TREND_METRIC_BASELINES: Record<
  TireTrendMetric,
  { baseline: number; step: number }
> = {
  PRESSURE: { baseline: 33, step: -0.4 },
  TEMPERATURE: { baseline: 22, step: 0.6 },
  ALIGNMENT: { baseline: 0.1, step: 0.05 },
  WEAR: { baseline: 12, step: 3 },
};

function buildTireTrendPoints(metric: TireTrendMetric, wheelOffset: number): TireTrendPoint[] {
  const { baseline, step } = TIRE_TREND_METRIC_BASELINES[metric];
  return TIRE_TREND_DATES.map((date, index) => {
    const value = Math.round((baseline + wheelOffset + step * index) * 10) / 10;
    return { date, fl: value, fr: value + 0.5, rl: value - 0.3, rr: value + 0.2 };
  });
}

function buildTireTrendFixtureSet(wheelOffset: number): Record<TireTrendMetric, TireTrendPoint[]> {
  return {
    PRESSURE: buildTireTrendPoints("PRESSURE", wheelOffset),
    TEMPERATURE: buildTireTrendPoints("TEMPERATURE", wheelOffset),
    ALIGNMENT: buildTireTrendPoints("ALIGNMENT", wheelOffset),
    WEAR: buildTireTrendPoints("WEAR", wheelOffset),
  };
}

/** All-null trend points for vehicle-mgmt-004 (AC16 null-value coverage extended to the chart). */
function buildAllNullTireTrendFixtureSet(): Record<TireTrendMetric, TireTrendPoint[]> {
  const nullPoints: TireTrendPoint[] = TIRE_TREND_DATES.map((date) => ({
    date,
    fl: null,
    fr: null,
    rl: null,
    rr: null,
  }));
  return { PRESSURE: nullPoints, TEMPERATURE: nullPoints, ALIGNMENT: nullPoints, WEAR: nullPoints };
}

export const tireTrendFixturesById: Record<string, Record<TireTrendMetric, TireTrendPoint[]>> = {
  "vehicle-mgmt-001": buildTireTrendFixtureSet(0),
  "vehicle-mgmt-003": buildTireTrendFixtureSet(4),
  "vehicle-mgmt-004": buildAllNullTireTrendFixtureSet(),
  "vehicle-mgmt-007": buildTireTrendFixtureSet(2),
};

export function toVehicleDetailResponse(vehicleId: string): VehicleDetailResponse | null {
  const vehicle = vehicleDetailFixturesById[vehicleId];
  if (!vehicle) return null;
  return {
    statusCode: 200,
    error: null,
    content: {
      vehicle,
      reservation: reservationFixturesById[vehicleId] ?? null,
    },
  };
}

/**
 * Unlike {@link toVehicleDetailResponse}, an unrecognized `vehicleId` falls
 * back to `{ rented: false }` instead of `null` — the confirmed contract has no
 * dedicated not-found case for this endpoint, so any vehicle without a
 * dedicated current-rental fixture is treated as "no current rental" rather
 * than a 404.
 */
export function toCurrentRentalResponse(vehicleId: string): CurrentRentalResponse {
  return {
    statusCode: 200,
    error: null,
    content: currentRentalFixturesById[vehicleId] ?? { rented: false },
  };
}

export function toVehicleAlertHistoryResponse(vehicleId: string): VehicleAlertHistoryResponse {
  return {
    statusCode: 200,
    error: null,
    content: { alerts: alertHistoryFixturesById[vehicleId] ?? [] },
  };
}

export function toVehicleUsageHistoryResponse(
  vehicleId: string,
  page: number,
  pageSize: number,
): VehicleUsageHistoryResponse {
  const allItems = usageHistoryFixturesById[vehicleId] ?? [];
  const totalCount = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = (page - 1) * pageSize;
  const items = allItems.slice(start, start + pageSize);
  const pageInfo: PageInfo = { page, pageSize, totalCount, totalPages };
  return { statusCode: 200, error: null, content: { items, pageInfo } };
}

export function toVehicleTireDetailResponse(vehicleId: string): VehicleTireDetailResponse {
  return {
    statusCode: 200,
    error: null,
    content: { tires: tireDetailFixturesById[vehicleId] ?? tireDetailFixturesById["vehicle-mgmt-001"] },
  };
}

export function toVehicleTireTrendResponse(
  vehicleId: string,
  metric: TireTrendMetric,
): VehicleTireTrendResponse {
  const set = tireTrendFixturesById[vehicleId] ?? tireTrendFixturesById["vehicle-mgmt-001"];
  return { statusCode: 200, error: null, content: { metric, points: set[metric] } };
}
