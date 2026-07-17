import { describe, expect, it } from "vitest";

import {
  toVehicleListItems,
  VehicleListContractMismatchError,
  VehicleListFetchError,
} from "@/lib/dashboard/vehicles/api";
import type { VehicleDto } from "@/types/dashboard/vehicle";

const baseVehicle: VehicleDto = {
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
};

function envelope(vehicles: unknown[]) {
  return {
    statusCode: 200,
    error: null,
    content: { refreshedAt: "2026-07-16T10:00:00.000Z", vehicles },
  };
}

describe("toVehicleListItems", () => {
  it("maps a normal envelope response to the UI model 1:1 (AC1)", () => {
    const result = toVehicleListItems(envelope([baseVehicle]));
    expect(result).toEqual([baseVehicle]);
  });

  it("passes through null `tireStatus`/`rentedAt`/`returnedAt` instead of dropping the row (AC1)", () => {
    const nullable: VehicleDto = {
      ...baseVehicle,
      vehicleId: "vehicle-mgmt-002",
      tireStatus: null,
      rentedAt: null,
      returnedAt: null,
    };
    const result = toVehicleListItems(envelope([nullable]));
    expect(result[0]).toEqual(nullable);
  });

  it("treats a duplicate vehicleId as a contract mismatch instead of silently keeping one", () => {
    expect(() =>
      toVehicleListItems(
        envelope([baseVehicle, { ...baseVehicle, plateNumber: "99마 9999" }]),
      ),
    ).toThrow(VehicleListContractMismatchError);
  });

  it("treats a missing `imageUrl` field as a contract mismatch, not an empty string", () => {
    const { imageUrl: _imageUrl, ...withoutImageUrl } = baseVehicle;
    expect(() => toVehicleListItems(envelope([withoutImageUrl]))).toThrow(
      VehicleListContractMismatchError,
    );
  });

  it("treats an unknown `status` enum value as a contract mismatch", () => {
    expect(() =>
      toVehicleListItems(envelope([{ ...baseVehicle, status: "SCRAPPED" }])),
    ).toThrow(VehicleListContractMismatchError);
  });

  it("treats an unparsable `rentedAt` string as a contract mismatch", () => {
    expect(() =>
      toVehicleListItems(
        envelope([{ ...baseVehicle, rentedAt: "not-a-date" }]),
      ),
    ).toThrow(VehicleListContractMismatchError);
  });

  it("treats a response missing the `content.vehicles` envelope as a contract mismatch", () => {
    expect(() => toVehicleListItems({ unexpected: "shape" })).toThrow(
      VehicleListContractMismatchError,
    );
  });

  it("returns an empty list for an empty `vehicles` array (AC3), not an error", () => {
    expect(toVehicleListItems(envelope([]))).toEqual([]);
  });

  it("treats statusCode >= 500 as a fetch error with kind server-error, not a contract mismatch (issue #33)", () => {
    try {
      toVehicleListItems({
        statusCode: 500,
        error: "Internal Server Error",
        content: null,
      });
      expect.unreachable("expected toVehicleListItems to throw");
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(VehicleListFetchError);
      expect((thrown as VehicleListFetchError).kind).toBe("server-error");
      expect((thrown as VehicleListFetchError).status).toBe(500);
    }
  });

  it("treats a business-level statusCode < 500 as a fetch error with kind client-error", () => {
    try {
      toVehicleListItems({
        statusCode: 400,
        error: "Bad Request",
        content: null,
      });
      expect.unreachable("expected toVehicleListItems to throw");
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(VehicleListFetchError);
      expect((thrown as VehicleListFetchError).kind).toBe("client-error");
      expect((thrown as VehicleListFetchError).status).toBe(400);
    }
  });

  it("treats a non-null `error` field as a client-error fetch error even with statusCode 200", () => {
    try {
      toVehicleListItems({
        statusCode: 200,
        error: "UNEXPECTED",
        content: { refreshedAt: "2026-07-16T10:00:00.000Z", vehicles: [] },
      });
      expect.unreachable("expected toVehicleListItems to throw");
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(VehicleListFetchError);
      expect((thrown as VehicleListFetchError).kind).toBe("client-error");
    }
  });
});
