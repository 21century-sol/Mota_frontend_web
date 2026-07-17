import { describe, expect, it } from "vitest";

import {
  toVehicleAlertHistoryItems,
  VehicleAlertHistoryContractMismatchError,
} from "@/lib/dashboard/vehicles/alert-history-api";

function envelope(alerts: unknown[]) {
  return { statusCode: 200, error: null, content: { alerts } };
}

const baseItem = {
  id: "alert-hist-001-01",
  tirePosition: "FL",
  message: "타이어 공기압을 점검했습니다.",
  occurredAt: "2026-06-15T05:00:00.000Z",
};

describe("toVehicleAlertHistoryItems", () => {
  it("maps a normal envelope response 1:1 (AC10)", () => {
    expect(toVehicleAlertHistoryItems(envelope([baseItem]))).toEqual([baseItem]);
  });

  it("allows a null tirePosition (non-tire alert)", () => {
    const item = { ...baseItem, tirePosition: null };
    expect(toVehicleAlertHistoryItems(envelope([item]))).toEqual([item]);
  });

  it("returns an empty list for 0 alerts (AC11), not an error", () => {
    expect(toVehicleAlertHistoryItems(envelope([]))).toEqual([]);
  });

  it("treats a duplicate id as a contract mismatch", () => {
    expect(() => toVehicleAlertHistoryItems(envelope([baseItem, baseItem]))).toThrow(
      VehicleAlertHistoryContractMismatchError,
    );
  });

  it("treats an invalid tirePosition enum as a contract mismatch", () => {
    expect(() =>
      toVehicleAlertHistoryItems(envelope([{ ...baseItem, tirePosition: "FRONT_LEFT" }])),
    ).toThrow(VehicleAlertHistoryContractMismatchError);
  });

  it("treats a response missing content.alerts as a contract mismatch", () => {
    expect(() => toVehicleAlertHistoryItems({ unexpected: "shape" })).toThrow(
      VehicleAlertHistoryContractMismatchError,
    );
  });
});
