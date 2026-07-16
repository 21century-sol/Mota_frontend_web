import type {
  VehicleDto,
  VehicleListFilters,
  VehicleManagementListResponse,
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
 */
export function filterVehicleFixture(
  vehicles: VehicleDto[],
  filters: VehicleListFilters,
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
