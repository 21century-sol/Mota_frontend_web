import { describe, expect, it } from "vitest";

import {
  VehicleSummaryContractMismatchError,
  VehicleSummaryFetchError,
  toVehicleSummaryCounts,
} from "@/lib/dashboard/summary/api";

describe("toVehicleSummaryCounts", () => {
  it("maps the confirmed envelope response to the UI model (issue #31)", () => {
    const result = toVehicleSummaryCounts({
      statusCode: 200,
      error: null,
      content: { total: 42, available: 18, rented: 20, repair: 4 },
    });

    expect(result).toEqual({
      ownedCount: 42,
      availableCount: 18,
      rentedCount: 20,
      unavailableCount: 4,
    });
  });

  it("maps a 0-count content object without treating 0 as missing data (AC3)", () => {
    const result = toVehicleSummaryCounts({
      statusCode: 200,
      error: null,
      content: { total: 0, available: 0, rented: 0, repair: 0 },
    });

    expect(result).toEqual({
      ownedCount: 0,
      availableCount: 0,
      rentedCount: 0,
      unavailableCount: 0,
    });
  });

  it("treats statusCode !== 200 as a fetch error, not a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts({
        statusCode: 500,
        error: "Internal Server Error",
        content: null,
      }),
    ).toThrow(VehicleSummaryFetchError);
  });

  it("treats a non-null error field as a fetch error even with statusCode 200", () => {
    expect(() =>
      toVehicleSummaryCounts({
        statusCode: 200,
        error: "UNEXPECTED",
        content: { total: 1, available: 1, rented: 0, repair: 0 },
      }),
    ).toThrow(VehicleSummaryFetchError);
  });

  it("treats a response that is not an object as a contract mismatch", () => {
    expect(() => toVehicleSummaryCounts("unexpected")).toThrow(
      VehicleSummaryContractMismatchError,
    );
  });

  it("treats a missing statusCode field as a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts({
        error: null,
        content: { total: 1, available: 1, rented: 0, repair: 0 },
      }),
    ).toThrow(VehicleSummaryContractMismatchError);
  });

  it("treats a content object missing a required field as a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts({
        statusCode: 200,
        error: null,
        content: { total: 1, available: 1, rented: 0 },
      }),
    ).toThrow(VehicleSummaryContractMismatchError);
  });

  it("treats a negative or non-numeric content field as a contract mismatch", () => {
    expect(() =>
      toVehicleSummaryCounts({
        statusCode: 200,
        error: null,
        content: { total: -1, available: 1, rented: 0, repair: 0 },
      }),
    ).toThrow(VehicleSummaryContractMismatchError);
  });
});
