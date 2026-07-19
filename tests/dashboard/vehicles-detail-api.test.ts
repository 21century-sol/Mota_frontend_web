import { describe, expect, it } from "vitest";

import {
  toVehicleDetailDto,
  VehicleDetailContractMismatchError,
  VehicleDetailFetchError,
} from "@/lib/dashboard/vehicles/detail-api";
import type { VehicleDetailDto } from "@/types/dashboard/vehicle";

const baseVehicle: VehicleDetailDto = {
  vehicleId: "vehicle-mgmt-001",
  imageUrls: ["https://mota-app.duckdns.org/uploads/vehicles/main.jpg"],
  plateNumber: "12가 3456",
  manufacturer: "현대",
  model: "아반떼 하이브리드",
  modelCode: "CN7",
  modelYear: 2022,
  vehicleType: "SEDAN",
  fuelType: "HYBRID",
  options: ["NAVIGATION"],
  mileage: 15230,
  lastInspectedAt: "2026-06-01",
  tireStatus: "NORMAL",
};

function envelope(
  content: unknown,
  overrides: { statusCode?: number; error?: string | null } = {},
) {
  return {
    statusCode: overrides.statusCode ?? 200,
    error: overrides.error ?? null,
    content,
  };
}

describe("toVehicleDetailDto", () => {
  it("maps a normal envelope to the vehicle payload directly (no vehicle/reservation wrapping, issue #42)", () => {
    const result = toVehicleDetailDto(envelope(baseVehicle));
    expect(result).toEqual(baseVehicle);
  });

  it("accepts an empty options array (0 options — PM display rule handled at render time)", () => {
    const vehicle: VehicleDetailDto = { ...baseVehicle, options: [] };
    const result = toVehicleDetailDto(envelope(vehicle));
    expect(result.options).toEqual([]);
  });

  it("accepts a variable-length, unique options array", () => {
    const vehicle: VehicleDetailDto = {
      ...baseVehicle,
      options: ["NAVIGATION", "HIPASS", "BLACKBOX", "SUNROOF"],
    };
    const result = toVehicleDetailDto(envelope(vehicle));
    expect(result.options).toEqual(["NAVIGATION", "HIPASS", "BLACKBOX", "SUNROOF"]);
  });

  it("treats a response missing `content` as a contract mismatch", () => {
    expect(() => toVehicleDetailDto({ statusCode: 200, error: null })).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats an invalid vehicle shape (missing `mileage`) as a contract mismatch", () => {
    const { mileage: _omit, ...withoutMileage } = baseVehicle;
    expect(() => toVehicleDetailDto(envelope(withoutMileage))).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats an unknown option enum code (e.g. a Korean label) as a contract mismatch", () => {
    const vehicle = { ...baseVehicle, options: ["네비게이션"] };
    expect(() => toVehicleDetailDto(envelope(vehicle))).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats a duplicate option code (uniqueItems violation) as a contract mismatch", () => {
    const vehicle = { ...baseVehicle, options: ["NAVIGATION", "NAVIGATION"] };
    expect(() => toVehicleDetailDto(envelope(vehicle))).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats a null `tireStatus` as a contract mismatch (non-null per the confirmed contract)", () => {
    const vehicle = { ...baseVehicle, tireStatus: null };
    expect(() => toVehicleDetailDto(envelope(vehicle))).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats a `lastInspectedAt` not in YYYY-MM-DD format as a contract mismatch", () => {
    const vehicle = { ...baseVehicle, lastInspectedAt: "2026-06-01T00:00:00.000Z" };
    expect(() => toVehicleDetailDto(envelope(vehicle))).toThrow(
      VehicleDetailContractMismatchError,
    );
  });

  it("treats a non-200 statusCode as a business-failure fetch error, not a contract mismatch (PM Assumption A4)", () => {
    expect(() => toVehicleDetailDto(envelope(baseVehicle, { statusCode: 500 }))).toThrow(
      VehicleDetailFetchError,
    );
  });

  it("treats a non-null `error` field as a business-failure fetch error", () => {
    expect(() =>
      toVehicleDetailDto(envelope(baseVehicle, { statusCode: 200, error: "VEHICLE_NOT_ACTIVE" })),
    ).toThrow(VehicleDetailFetchError);
  });

  it("classifies a 4xx business failure as client-error and a 5xx as server-error", () => {
    try {
      toVehicleDetailDto(envelope(baseVehicle, { statusCode: 400 }));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(VehicleDetailFetchError);
      expect((error as VehicleDetailFetchError).kind).toBe("client-error");
    }

    try {
      toVehicleDetailDto(envelope(baseVehicle, { statusCode: 503 }));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(VehicleDetailFetchError);
      expect((error as VehicleDetailFetchError).kind).toBe("server-error");
    }
  });
});
