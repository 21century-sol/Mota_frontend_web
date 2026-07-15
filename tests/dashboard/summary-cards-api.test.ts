import { describe, expect, it } from "vitest";

import {
  VehicleSummaryContractMismatchError,
  toVehicleSummaryCounts,
} from "@/lib/dashboard/summary/api";

describe("toVehicleSummaryCounts", () => {
  it("maps a bare array response (안 B) to the UI model", () => {
    const result = toVehicleSummaryCounts([
      { status: "OWNED", count: 42 },
      { status: "AVAILABLE", count: 18 },
      { status: "RENTED", count: 20 },
      { status: "UNAVAILABLE", count: 4 },
    ]);

    expect(result).toEqual({
      ownedCount: 42,
      availableCount: 18,
      rentedCount: 20,
      unavailableCount: 4,
    });
  });

  it("unwraps a checklist-style envelope response (안 A, D1 unresolved)", () => {
    const result = toVehicleSummaryCounts({
      statusCode: 200,
      error: null,
      content: [
        { status: "OWNED", count: 5 },
        { status: "AVAILABLE", count: 3 },
        { status: "RENTED", count: 1 },
        { status: "UNAVAILABLE", count: 0 },
      ],
    });

    expect(result).toEqual({
      ownedCount: 5,
      availableCount: 3,
      rentedCount: 1,
      unavailableCount: 0,
    });
  });

  it("falls back a missing status to 0 instead of throwing", () => {
    const result = toVehicleSummaryCounts([
      { status: "OWNED", count: 10 },
      { status: "AVAILABLE", count: 2 },
      { status: "RENTED", count: 7 },
      // UNAVAILABLE omitted on purpose
    ]);

    expect(result.unavailableCount).toBe(0);
    expect(result).toEqual({
      ownedCount: 10,
      availableCount: 2,
      rentedCount: 7,
      unavailableCount: 0,
    });
  });

  it("treats a duplicate status entry as a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts([
        { status: "OWNED", count: 10 },
        { status: "OWNED", count: 99 },
      ]),
    ).toThrow(VehicleSummaryContractMismatchError);
  });

  it("treats an unknown status value as a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts([{ status: "SCRAPPED", count: 1 }]),
    ).toThrow(VehicleSummaryContractMismatchError);
  });

  it("treats a response that is neither a bare array nor a content-array envelope as a contract mismatch", () => {
    expect(() => toVehicleSummaryCounts({ unexpected: "shape" })).toThrow(
      VehicleSummaryContractMismatchError,
    );
  });

  it("treats a negative or non-numeric count as a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts([{ status: "OWNED", count: -1 }]),
    ).toThrow(VehicleSummaryContractMismatchError);
  });
});
