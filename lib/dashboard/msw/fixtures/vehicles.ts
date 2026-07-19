import type {
  AlertHistoryItem,
  CurrentRental,
  CurrentRentalResponse,
  RentalHistoryItem,
  RentalStatus,
  TireDetail,
  TireStatus,
  TireTrendMetric,
  TireTrendPoint,
  VehicleAlertHistoryResponse,
  VehicleDetailDto,
  VehicleDetailResponse,
  VehicleDto,
  VehicleManagementListResponse,
  VehicleManagementStatus,
  VehicleRentalHistoryResponse,
  VehicleTireDetailResponse,
  VehicleTireTrendResponse,
} from "@/types/dashboard/vehicle";
import { RENTAL_STATUSES } from "@/types/dashboard/vehicle";

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
// Issue #42 — `/dashboard/vehicles/[vehicleId]` detail + current-rental
// fixtures (breaking rewrite of the #15 provisional set — standalone
// `VehicleDetailDto`, `imageUrls`/`mileage`/`modelCode` fields, enum-coded
// `options`, and the separate `/current-rental` endpoint replacing the
// bundled `reservation`). The same 4 ids as the #15 detail-screen fixtures
// below (`.claude/handoffs/15-api-specs.md` fixture table) keep their
// existing scenario roles: vehicle-mgmt-001 (full: 3 images/3 options),
// -003 (2 images/3 options), -004 (single image/0 options), -007 (3
// images/2 options). `VEHICLE_DETAIL_NOT_FOUND_ID` is a 5th id deliberately
// absent from every fixture map below (AC6).
// ---------------------------------------------------------------------------

export const VEHICLE_DETAIL_NOT_FOUND_ID = "vehicle-mgmt-999";

/** Distinct per-index URL (not one repeated constant) so React list keys in `VehicleInfoPanel` stay unique. */
function placeholderPhotos(vehicleId: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) =>
      `https://mota-app.duckdns.org/uploads/vehicles/${vehicleId}-detail-${index + 1}.jpg`,
  );
}

export const vehicleDetailFixturesById: Record<string, VehicleDetailDto> = {
  "vehicle-mgmt-001": {
    vehicleId: "vehicle-mgmt-001",
    imageUrls: placeholderPhotos("vehicle-mgmt-001", 3),
    plateNumber: "12가 3456",
    manufacturer: "현대",
    model: "아반떼 하이브리드",
    modelCode: "CN7",
    modelYear: 2022,
    vehicleType: "SEDAN",
    fuelType: "HYBRID",
    options: ["NAVIGATION", "REAR_CAMERA", "HIPASS"],
    mileage: 15230,
    lastInspectedAt: "2026-06-01",
    tireStatus: "NORMAL",
  },
  "vehicle-mgmt-003": {
    vehicleId: "vehicle-mgmt-003",
    imageUrls: placeholderPhotos("vehicle-mgmt-003", 2),
    plateNumber: "56다 1234",
    manufacturer: "현대",
    model: "투싼",
    modelCode: "NX4",
    modelYear: 2023,
    vehicleType: "SUV",
    fuelType: "DIESEL",
    options: ["NAVIGATION", "SUNROOF", "VENTILATED_SEAT"],
    mileage: 42010,
    lastInspectedAt: "2026-05-20",
    tireStatus: "WARNING",
  },
  // Single image + 0 options (PM display rule: options.length===0 → "—").
  "vehicle-mgmt-004": {
    vehicleId: "vehicle-mgmt-004",
    imageUrls: placeholderPhotos("vehicle-mgmt-004", 1),
    plateNumber: "78라 4321",
    manufacturer: "기아",
    model: "모닝",
    modelCode: "JA",
    modelYear: 2020,
    vehicleType: "HATCHBACK",
    fuelType: "GASOLINE",
    options: [],
    mileage: 8320,
    lastInspectedAt: "2026-04-15",
    tireStatus: "NORMAL",
  },
  "vehicle-mgmt-007": {
    vehicleId: "vehicle-mgmt-007",
    imageUrls: placeholderPhotos("vehicle-mgmt-007", 3),
    plateNumber: "22사 2222",
    manufacturer: "기아",
    model: "스포티지",
    modelCode: "NQ5",
    modelYear: 2022,
    vehicleType: "SUV",
    fuelType: "DIESEL",
    options: ["NAVIGATION", "HIPASS"],
    mileage: 51200,
    lastInspectedAt: "2026-04-10",
    tireStatus: "CAUTION",
  },
} satisfies Record<string, VehicleDetailDto>;

/**
 * `GET /api/dashboard/vehicles/{vehicleId}/current-rental` fixtures (issue
 * #42). All wire date strings are computed by hand against a fixed reference
 * instant — `FIXED_NOW_KST = "2026.07.19 12:00:00"` (KST) — never via
 * `new Date()`, so scenario boundaries stay deterministic across test runs.
 *
 * `vehicle-mgmt-013` is a 5th id (not present in `vehicleDetailFixturesById`
 * above) used only to exercise the overdue scenario — the "예약 내역" panel
 * and its `useVehicleCurrentRental` query are independent of the detail
 * fixture set (separate endpoint), so this is a valid, isolated scenario id.
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

/**
 * Newest-first, fixed arrays (issue #47, `.claude/handoffs/47-api-specs.md`
 * MSW Scenarios) — the array literal's own order *is* the "server-returned
 * newest-first" order; `toVehicleAlertHistoryItems` never re-sorts, so the
 * order declared here is exactly what the UI renders. Times are static
 * "YYYY.MM.DD HH:mm:ss" KST wire strings computed backward from the fixed
 * `FIXED_NOW` used across the vehicle-detail fixtures (2026-07-19), not
 * `new Date()`.
 */
export const alertHistoryFixturesById: Record<string, AlertHistoryItem[]> = {
  "vehicle-mgmt-001": [
    {
      alertId: "alert-hist-001-02",
      tireId: "tire-001-fr",
      position: "FR",
      alertLevel: "WARNING",
      alertTitle: "공기압 알림",
      alertTime: "2026.07.18 11:00:00",
    },
    {
      alertId: "alert-hist-001-01",
      tireId: "tire-001-fl",
      position: "FL",
      alertLevel: "DANGER",
      alertTitle: "마모도 알림",
      alertTime: "2026.06.01 10:00:00",
    },
  ],
  "vehicle-mgmt-003": [
    {
      alertId: "alert-hist-003-01",
      tireId: "tire-003-fr",
      position: "FR",
      alertLevel: "DANGER",
      alertTitle: "공기압 알림",
      alertTime: "2026.07.17 10:01:00",
    },
    {
      alertId: "alert-hist-003-02",
      tireId: "tire-003-fl",
      position: "FL",
      alertLevel: "WARNING",
      alertTitle: "마모도 알림",
      alertTime: "2026.07.15 14:30:00",
    },
    {
      alertId: "alert-hist-003-03",
      tireId: "tire-003-rl",
      position: "RL",
      alertLevel: "WARNING",
      alertTitle: "펑크 알림",
      alertTime: "2026.06.20 09:05:00",
    },
  ],
  // Empty (AC3/PM AC3).
  "vehicle-mgmt-004": [],
  "vehicle-mgmt-007": [
    {
      alertId: "alert-hist-007-01",
      tireId: "tire-007-rl",
      position: "RL",
      alertLevel: "WARNING",
      alertTitle: "온도 알림",
      alertTime: "2026.07.06 00:07:00",
    },
  ],
} satisfies Record<string, AlertHistoryItem[]>;

/**
 * `GET /api/dashboard/vehicles/{vehicleId}/rentals` fixtures (issue #49,
 * confirmed real backend contract — replaces the #15 provisional
 * `UsageHistoryItem`/`usageHistoryFixturesById` set entirely). Renter names
 * are synthetic Korean rental-car data (CLAUDE.md §6). All wire date strings
 * are static "YYYY.MM.DD HH:mm:ss" KST literals — never `new Date()`.
 *
 * `vehicle-mgmt-003` (20 rows) exercises the 3-page/8-per-page pagination
 * boundary (8/8/4 split, `.claude/handoffs/49-api-specs.md` MSW Scenarios) —
 * generated deterministically since the exact field values don't matter for
 * that scenario, only that they're valid/unique. `vehicle-mgmt-001` (5 rows,
 * `.claude/handoffs/49-api-specs.md`) is hand-written to cover all 3
 * `RentalStatus` values (validated but never rendered). `vehicle-mgmt-007`
 * (3 rows) is hand-written to hit every PM display-rule boundary in one
 * fixture: `rentalMinutes` 0/4860, `distanceKm` 312.5/45.2, `alertCount`
 * null/0/3, `reportDownloadUrl` null/non-null.
 */
function buildBulkRentalHistoryItems(vehicleId: string, count: number): RentalHistoryItem[] {
  const renters: Array<{ name: string; phone: string }> = [
    { name: "윤지호", phone: "010-0000-0001" },
    { name: "최유진", phone: "010-0000-0002" },
    { name: "정하윤", phone: "010-0000-0003" },
    { name: "강도현", phone: "010-0000-0004" },
    { name: "임채원", phone: "010-0000-0005" },
  ];

  return Array.from({ length: count }, (_, index) => {
    const renter = renters[index % renters.length];
    // Kept within a single fixed month (June, day<=28) so no calendar-rollover
    // arithmetic is needed — a static literal per row, not `new Date()`.
    const day = (index % 14) + 1;
    const startDay = String(day).padStart(2, "0");
    const endDay = String(Math.min(day + 1, 28)).padStart(2, "0");
    const status: RentalStatus = RENTAL_STATUSES[index % RENTAL_STATUSES.length];
    return {
      rentalId: `rental-hist-${vehicleId}-${String(index + 1).padStart(2, "0")}`,
      renterName: renter.name,
      contact: renter.phone,
      status,
      startDate: `2026.06.${startDay} 09:00:00`,
      endDate: `2026.06.${endDay} 11:00:00`,
      rentalMinutes: 1500 + index * 47,
      distanceKm: 80 + index * 12.5,
      alertCount: index % 4 === 0 ? null : index % 3,
      reportDownloadUrl:
        index % 2 === 0
          ? `https://mota-app.duckdns.org/reports/${vehicleId}-${index + 1}.pdf`
          : null,
    } satisfies RentalHistoryItem;
  });
}

export const rentalHistoryFixturesById: Record<string, RentalHistoryItem[]> = {
  "vehicle-mgmt-001": [
    {
      rentalId: "rental-hist-vehicle-mgmt-001-01",
      renterName: "윤지호",
      contact: "010-0000-0001",
      status: "RETURNED",
      startDate: "2026.06.01 09:00:00",
      endDate: "2026.06.03 11:00:00",
      rentalMinutes: 3000,
      distanceKm: 210.4,
      alertCount: 2,
      reportDownloadUrl: "https://mota-app.duckdns.org/reports/vehicle-mgmt-001-01.pdf",
    },
    {
      rentalId: "rental-hist-vehicle-mgmt-001-02",
      renterName: "최유진",
      contact: "010-0000-0002",
      status: "RETURNED",
      startDate: "2026.06.10 10:00:00",
      endDate: "2026.06.10 18:00:00",
      rentalMinutes: 480,
      distanceKm: 65.8,
      alertCount: null,
      reportDownloadUrl: "https://mota-app.duckdns.org/reports/vehicle-mgmt-001-02.pdf",
    },
    {
      rentalId: "rental-hist-vehicle-mgmt-001-03",
      renterName: "정하윤",
      contact: "010-0000-0003",
      status: "IN_PROGRESS",
      startDate: "2026.07.15 08:00:00",
      endDate: "2026.07.20 08:00:00",
      rentalMinutes: 2160,
      distanceKm: 150,
      alertCount: 0,
      reportDownloadUrl: null,
    },
    {
      rentalId: "rental-hist-vehicle-mgmt-001-04",
      renterName: "강도현",
      contact: "010-0000-0004",
      status: "RESERVED",
      startDate: "2026.07.25 09:00:00",
      endDate: "2026.07.27 09:00:00",
      rentalMinutes: 0,
      distanceKm: 0,
      alertCount: null,
      reportDownloadUrl: null,
    },
    {
      rentalId: "rental-hist-vehicle-mgmt-001-05",
      renterName: "임채원",
      contact: "010-0000-0005",
      status: "RETURNED",
      startDate: "2026.05.20 09:00:00",
      endDate: "2026.05.22 09:00:00",
      rentalMinutes: 2880,
      distanceKm: 340.2,
      alertCount: 1,
      reportDownloadUrl: "https://mota-app.duckdns.org/reports/vehicle-mgmt-001-05.pdf",
    },
  ],
  "vehicle-mgmt-003": buildBulkRentalHistoryItems("vehicle-mgmt-003", 20),
  // Empty (PM AC3 for this tab).
  "vehicle-mgmt-004": [],
  // Boundary coverage (PM AC5/AC6/AC7): rentalMinutes 0/4860, distanceKm
  // 312.5/45.2, alertCount null/0/3, reportDownloadUrl null/non-null.
  "vehicle-mgmt-007": [
    {
      rentalId: "rental-hist-vehicle-mgmt-007-01",
      renterName: "윤지호",
      contact: "010-0000-0001",
      status: "RESERVED",
      startDate: "2026.07.10 09:00:00",
      endDate: "2026.07.10 09:00:00",
      rentalMinutes: 0,
      distanceKm: 0,
      alertCount: null,
      reportDownloadUrl: null,
    },
    {
      rentalId: "rental-hist-vehicle-mgmt-007-02",
      renterName: "최유진",
      contact: "010-0000-0002",
      status: "RETURNED",
      startDate: "2026.06.01 09:00:00",
      endDate: "2026.06.04 12:00:00",
      rentalMinutes: 4860,
      distanceKm: 312.5,
      alertCount: 0,
      reportDownloadUrl: "https://mota-app.duckdns.org/reports/vehicle-mgmt-007-02.pdf",
    },
    {
      rentalId: "rental-hist-vehicle-mgmt-007-03",
      renterName: "정하윤",
      contact: "010-0000-0003",
      status: "IN_PROGRESS",
      startDate: "2026.07.16 09:00:00",
      endDate: "2026.07.18 09:00:00",
      rentalMinutes: 1200,
      distanceKm: 45.2,
      alertCount: 3,
      reportDownloadUrl: "https://mota-app.duckdns.org/reports/vehicle-mgmt-007-03.pdf",
    },
  ],
} satisfies Record<string, RentalHistoryItem[]>;

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
  return { statusCode: 200, error: null, content: vehicle };
}

/**
 * Unlike {@link toVehicleDetailResponse}, an unrecognized `vehicleId` falls
 * back to `{ rented: false }` instead of `null` — the confirmed contract has
 * no dedicated not-found case for this endpoint (`.claude/handoffs/42-api-specs.md`
 * "Non-blocking Design Notes"), so any vehicle without a dedicated current-rental
 * fixture is treated as "no current rental" rather than a 404.
 */
export function toCurrentRentalResponse(vehicleId: string): CurrentRentalResponse {
  return {
    statusCode: 200,
    error: null,
    content: currentRentalFixturesById[vehicleId] ?? { rented: false },
  };
}

/**
 * `content` is the array directly (issue #47, no `alerts` wrapping). An
 * unrecognized `vehicleId` falls back to `[]`, same pattern as
 * `toCurrentRentalResponse`'s `{ rented: false }` fallback — this endpoint's
 * confirmed contract has no dedicated not-found case.
 */
export function toVehicleAlertHistoryResponse(vehicleId: string): VehicleAlertHistoryResponse {
  return {
    statusCode: 200,
    error: null,
    content: alertHistoryFixturesById[vehicleId] ?? [],
  };
}

/**
 * `page` is 0-based (issue #49 confirmed contract) — the handler reads it
 * straight off the request's `page` query param, no 1-based conversion here
 * (that only happens in the adapter's `toVehicleRentalHistoryResult`). An
 * unrecognized `vehicleId` falls back to `[]`, same "no dedicated not-found
 * case" convention as `toCurrentRentalResponse`/`toVehicleAlertHistoryResponse`.
 */
export function toVehicleRentalHistoryResponse(
  vehicleId: string,
  page: number,
  size: number,
): VehicleRentalHistoryResponse {
  const allItems = rentalHistoryFixturesById[vehicleId] ?? [];
  const totalElements = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const content = allItems.slice(start, start + size);
  return {
    statusCode: 200,
    error: null,
    content: { content, page, size, totalPages, totalElements },
  };
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
