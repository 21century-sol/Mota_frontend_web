import { describe, expect, it } from "vitest";

import {
  toVehicleUsageHistoryResult,
  VehicleUsageHistoryContractMismatchError,
} from "@/lib/dashboard/vehicles/usage-history-api";

const baseItem = {
  id: "usage-hist-001-01",
  renterName: "박지호",
  renterPhone: "010-0000-0001",
  rentedAt: "2026-06-01T00:00:00.000Z",
  returnedAt: "2026-06-03T00:00:00.000Z",
  mileageKm: 120,
  alertCount: 0,
};

const pageInfo = { page: 1, pageSize: 8, totalCount: 1, totalPages: 1 };

function envelope(items: unknown[], info: unknown = pageInfo) {
  return { statusCode: 200, error: null, content: { items, pageInfo: info } };
}

describe("toVehicleUsageHistoryResult", () => {
  it("maps a normal envelope response 1:1 (AC19)", () => {
    const result = toVehicleUsageHistoryResult(envelope([baseItem]));
    expect(result.items).toEqual([baseItem]);
    expect(result.pageInfo).toEqual(pageInfo);
  });

  it("allows a null returnedAt (ongoing rental)", () => {
    const item = { ...baseItem, returnedAt: null };
    expect(toVehicleUsageHistoryResult(envelope([item])).items).toEqual([item]);
  });

  it("returns an empty list for 0 usage history entries (AC20), not an error", () => {
    const emptyPageInfo = { page: 1, pageSize: 8, totalCount: 0, totalPages: 1 };
    const result = toVehicleUsageHistoryResult(envelope([], emptyPageInfo));
    expect(result.items).toEqual([]);
  });

  it("treats a duplicate id as a contract mismatch", () => {
    expect(() => toVehicleUsageHistoryResult(envelope([baseItem, baseItem]))).toThrow(
      VehicleUsageHistoryContractMismatchError,
    );
  });

  it("treats a malformed pageInfo as a contract mismatch", () => {
    expect(() => toVehicleUsageHistoryResult(envelope([baseItem], { page: 1 }))).toThrow(
      VehicleUsageHistoryContractMismatchError,
    );
  });

  it("treats a missing content.items field as a contract mismatch", () => {
    expect(() =>
      toVehicleUsageHistoryResult({ statusCode: 200, error: null, content: { pageInfo } }),
    ).toThrow(VehicleUsageHistoryContractMismatchError);
  });
});
