import { describe, expect, it } from "vitest";

import {
  toVehicleTireDetails,
  VehicleTireDetailContractMismatchError,
} from "@/lib/dashboard/vehicles/tire-detail-api";
import { hasTireNeedingAttention, countTiresNeedingAttention } from "@/lib/dashboard/vehicles/tire";
import type { TireDetail } from "@/types/dashboard/vehicle";

function tire(position: TireDetail["position"], status: TireDetail["status"]): TireDetail {
  return {
    position,
    status,
    expectedReplacementAt: 8400,
    pressureKpa: 32,
    temperatureCelsius: 24,
    alignmentDeg: 0.2,
    treadDepthMm: 18,
  };
}

const fourNormalTires: TireDetail[] = [
  tire("FL", "NORMAL"),
  tire("FR", "NORMAL"),
  tire("RL", "NORMAL"),
  tire("RR", "NORMAL"),
];

function envelope(tires: unknown[]) {
  return { statusCode: 200, error: null, content: { tires } };
}

describe("toVehicleTireDetails", () => {
  it("maps a normal 4-tire envelope response 1:1 (AC16)", () => {
    expect(toVehicleTireDetails(envelope(fourNormalTires))).toEqual(fourNormalTires);
  });

  it("allows every numeric field to be null (AC16 null coverage)", () => {
    const nullTire: TireDetail = {
      position: "FL",
      status: "NORMAL",
      expectedReplacementAt: null,
      pressureKpa: null,
      temperatureCelsius: null,
      alignmentDeg: null,
      treadDepthMm: null,
    };
    expect(
      toVehicleTireDetails(
        envelope([nullTire, tire("FR", "NORMAL"), tire("RL", "NORMAL"), tire("RR", "NORMAL")]),
      )[0],
    ).toEqual(nullTire);
  });

  it("treats fewer than 4 tires as a contract mismatch", () => {
    expect(() => toVehicleTireDetails(envelope([tire("FL", "NORMAL")]))).toThrow(
      VehicleTireDetailContractMismatchError,
    );
  });

  it("treats a duplicate wheel position as a contract mismatch", () => {
    expect(() =>
      toVehicleTireDetails(
        envelope([tire("FL", "NORMAL"), tire("FL", "NORMAL"), tire("RL", "NORMAL"), tire("RR", "NORMAL")]),
      ),
    ).toThrow(VehicleTireDetailContractMismatchError);
  });
});

describe("hasTireNeedingAttention / countTiresNeedingAttention (AC15)", () => {
  it("is false when all 4 tires are NORMAL", () => {
    expect(hasTireNeedingAttention(fourNormalTires)).toBe(false);
    expect(countTiresNeedingAttention(fourNormalTires)).toBe(0);
  });

  it("is true when at least one tire is CAUTION or WARNING, and counts them", () => {
    const tires = [tire("FL", "CAUTION"), tire("FR", "WARNING"), tire("RL", "NORMAL"), tire("RR", "NORMAL")];
    expect(hasTireNeedingAttention(tires)).toBe(true);
    expect(countTiresNeedingAttention(tires)).toBe(2);
  });

  it("is true for a CAUTION-only boundary case with no WARNING (fixture vehicle-mgmt-007)", () => {
    const tires = [tire("FL", "CAUTION"), tire("FR", "CAUTION"), tire("RL", "CAUTION"), tire("RR", "CAUTION")];
    expect(hasTireNeedingAttention(tires)).toBe(true);
    expect(countTiresNeedingAttention(tires)).toBe(4);
  });
});
