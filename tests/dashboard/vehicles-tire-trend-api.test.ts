import { describe, expect, it } from "vitest";

import {
  toVehicleTireTrendPoints,
  VehicleTireTrendContractMismatchError,
} from "@/lib/dashboard/vehicles/tire-trend-api";

const basePoint = { date: "2026-06-01T00:00:00.000Z", fl: 32, fr: 32.5, rl: 31.7, rr: 32.2 };

function envelope(points: unknown[]) {
  return { statusCode: 200, error: null, content: { metric: "PRESSURE", points } };
}

describe("toVehicleTireTrendPoints", () => {
  it("maps a normal envelope response 1:1 (AC18)", () => {
    expect(toVehicleTireTrendPoints(envelope([basePoint]))).toEqual([basePoint]);
  });

  it("allows any wheel value to be null", () => {
    const point = { ...basePoint, fl: null };
    expect(toVehicleTireTrendPoints(envelope([point]))).toEqual([point]);
  });

  it("returns an empty list instead of throwing when there is no trend data", () => {
    expect(toVehicleTireTrendPoints(envelope([]))).toEqual([]);
  });

  it("treats an unparsable date as a contract mismatch", () => {
    expect(() =>
      toVehicleTireTrendPoints(envelope([{ ...basePoint, date: "not-a-date" }])),
    ).toThrow(VehicleTireTrendContractMismatchError);
  });

  it("treats a missing content.points field as a contract mismatch", () => {
    expect(() =>
      toVehicleTireTrendPoints({ statusCode: 200, error: null, content: { metric: "PRESSURE" } }),
    ).toThrow(VehicleTireTrendContractMismatchError);
  });
});
