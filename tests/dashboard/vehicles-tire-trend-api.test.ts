import { describe, expect, it } from "vitest";

import type { TireTrendTire } from "@/types/dashboard/vehicle";
import {
  isTireTrendPointsEmpty,
  toTireTrendPoints,
  toVehicleTireTrendTires,
  VehicleTireTrendContractMismatchError,
} from "@/lib/dashboard/vehicles/tire-trend-api";

const sampleTires: TireTrendTire[] = [
  {
    tireId: "b0000001-0000-0000-0000-000000000001",
    position: "FL",
    pressure: [
      { date: "2026-07-19", value: 32.97 },
      { date: "2026-07-20", value: null },
    ],
    temperature: [
      { date: "2026-07-19", value: 48.11 },
      { date: "2026-07-20", value: null },
    ],
    wheelAlignment: [
      { date: "2026-07-19", value: 0.1517 },
      { date: "2026-07-20", value: null },
    ],
    wearLevel: [
      { date: "2026-07-19", value: 97.62 },
      { date: "2026-07-20", value: null },
    ],
  },
  {
    tireId: "b0000001-0000-0000-0000-000000000002",
    position: "FR",
    pressure: [
      { date: "2026-07-19", value: 33 },
      { date: "2026-07-20", value: null },
    ],
    temperature: [
      { date: "2026-07-19", value: 45.33 },
      { date: "2026-07-20", value: null },
    ],
    wheelAlignment: [
      { date: "2026-07-19", value: 0.1119 },
      { date: "2026-07-20", value: null },
    ],
    wearLevel: [
      { date: "2026-07-19", value: 87.21 },
      { date: "2026-07-20", value: null },
    ],
  },
  {
    tireId: "b0000001-0000-0000-0000-000000000003",
    position: "RL",
    pressure: [
      { date: "2026-07-19", value: 33.97 },
      { date: "2026-07-20", value: null },
    ],
    temperature: [
      { date: "2026-07-19", value: 40.64 },
      { date: "2026-07-20", value: null },
    ],
    wheelAlignment: [
      { date: "2026-07-19", value: 0.106 },
      { date: "2026-07-20", value: null },
    ],
    wearLevel: [
      { date: "2026-07-19", value: 49.49 },
      { date: "2026-07-20", value: null },
    ],
  },
  {
    tireId: "b0000001-0000-0000-0000-000000000004",
    position: "RR",
    pressure: [
      { date: "2026-07-19", value: 30.92 },
      { date: "2026-07-20", value: null },
    ],
    temperature: [
      { date: "2026-07-19", value: 41.66 },
      { date: "2026-07-20", value: null },
    ],
    wheelAlignment: [
      { date: "2026-07-19", value: 0.1076 },
      { date: "2026-07-20", value: null },
    ],
    wearLevel: [
      { date: "2026-07-19", value: 52.49 },
      { date: "2026-07-20", value: null },
    ],
  },
];

function envelope(tires: unknown[]) {
  return { statusCode: 200, error: null, content: { tires } };
}

describe("toVehicleTireTrendTires", () => {
  it("maps a normal envelope response 1:1", () => {
    expect(toVehicleTireTrendTires(envelope(sampleTires))).toEqual(sampleTires);
  });

  it("returns an empty list instead of throwing when there is no trend data", () => {
    expect(toVehicleTireTrendTires(envelope([]))).toEqual([]);
  });

  it("treats an invalid date as a contract mismatch", () => {
    const bad = structuredClone(sampleTires);
    bad[0].pressure[0].date = "not-a-date";
    expect(() => toVehicleTireTrendTires(envelope(bad))).toThrow(
      VehicleTireTrendContractMismatchError,
    );
  });

  it("treats a missing content.tires field as a contract mismatch", () => {
    expect(() =>
      toVehicleTireTrendTires({ statusCode: 200, error: null, content: { points: [] } }),
    ).toThrow(VehicleTireTrendContractMismatchError);
  });

  it("treats an invalid position as a contract mismatch", () => {
    const bad = structuredClone(sampleTires);
    (bad[0] as { position: string }).position = "XX";
    expect(() => toVehicleTireTrendTires(envelope(bad))).toThrow(
      VehicleTireTrendContractMismatchError,
    );
  });
});

describe("toTireTrendPoints", () => {
  it("pivots per-tire pressure series into wide chart points", () => {
    expect(toTireTrendPoints(sampleTires, "PRESSURE")).toEqual([
      { date: "2026-07-19", fl: 32.97, fr: 33, rl: 33.97, rr: 30.92 },
      { date: "2026-07-20", fl: null, fr: null, rl: null, rr: null },
    ]);
  });

  it("selects temperature when TEMPERATURE metric is requested", () => {
    expect(toTireTrendPoints(sampleTires, "TEMPERATURE")[0]).toEqual({
      date: "2026-07-19",
      fl: 48.11,
      fr: 45.33,
      rl: 40.64,
      rr: 41.66,
    });
  });

  it("selects wheelAlignment when ALIGNMENT metric is requested", () => {
    expect(toTireTrendPoints(sampleTires, "ALIGNMENT")[0].fl).toBe(0.1517);
  });

  it("selects wearLevel when WEAR metric is requested", () => {
    expect(toTireTrendPoints(sampleTires, "WEAR")[0].fl).toBe(97.62);
  });
});

describe("isTireTrendPointsEmpty", () => {
  it("returns true for an empty list", () => {
    expect(isTireTrendPointsEmpty([])).toBe(true);
  });

  it("returns true when every wheel value is null", () => {
    expect(
      isTireTrendPointsEmpty([{ date: "2026-07-20", fl: null, fr: null, rl: null, rr: null }]),
    ).toBe(true);
  });

  it("returns false when any wheel has a value", () => {
    expect(
      isTireTrendPointsEmpty([{ date: "2026-07-19", fl: 32, fr: null, rl: null, rr: null }]),
    ).toBe(false);
  });
});
