import { describe, expect, it } from "vitest";

import {
  computeReservationSummary,
  toVehicleDetailResult,
  VehicleDetailContractMismatchError,
} from "@/lib/dashboard/vehicles/detail-api";
import type { ReservationSummaryDto, VehicleDetailDto } from "@/types/dashboard/vehicle";

const baseVehicle: VehicleDetailDto = {
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
  photoUrls: ["https://mota-app.duckdns.org/uploads/vehicles/main.jpg"],
  options: ["네비게이션"],
  totalMileageKm: 15230,
  lastInspectedAt: "2026-06-01T00:00:00.000Z",
};

const baseReservation: ReservationSummaryDto = {
  reservationId: "reservation-001",
  renterName: "김민준",
  startAt: "2026-07-15T00:00:00.000Z",
  returnAt: "2026-07-20T00:00:00.000Z",
};

function envelope(vehicle: unknown, reservation: unknown) {
  return { statusCode: 200, error: null, content: { vehicle, reservation } };
}

describe("toVehicleDetailResult", () => {
  it("maps a normal envelope with a reservation (AC4, AC8)", () => {
    const result = toVehicleDetailResult(envelope(baseVehicle, baseReservation));
    expect(result.vehicle).toEqual(baseVehicle);
    expect(result.reservation).toEqual(baseReservation);
  });

  it("maps a null reservation to null instead of throwing (AC9)", () => {
    const result = toVehicleDetailResult(envelope(baseVehicle, null));
    expect(result.reservation).toBeNull();
  });

  it("treats a missing `content.vehicle` field as a contract mismatch", () => {
    expect(() => toVehicleDetailResult({ statusCode: 200, error: null, content: {} })).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats an invalid vehicle shape (missing totalMileageKm) as a contract mismatch", () => {
    const { totalMileageKm: _omit, ...withoutMileage } = baseVehicle;
    expect(() => toVehicleDetailResult(envelope(withoutMileage, null))).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats an invalid reservation shape as a contract mismatch", () => {
    expect(() =>
      toVehicleDetailResult(envelope(baseVehicle, { renterName: "김민준" })),
    ).toThrow(VehicleDetailContractMismatchError);
  });
});

describe("computeReservationSummary", () => {
  it("computes daysUntilReturn from the injected `now`, never calling Date.now() itself", () => {
    const now = new Date("2026-07-16T00:00:00.000Z");
    const summary = computeReservationSummary(baseReservation, now);
    expect(summary.daysUntilReturn).toBe(4);
    expect(summary.renterName).toBe("김민준");
  });

  it("rounds up a sub-day remainder instead of showing 0일", () => {
    const now = new Date("2026-07-19T23:00:00.000Z");
    const summary = computeReservationSummary(baseReservation, now);
    expect(summary.daysUntilReturn).toBe(1);
  });
});
