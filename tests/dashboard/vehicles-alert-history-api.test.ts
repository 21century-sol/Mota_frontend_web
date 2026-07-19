import { describe, expect, it } from "vitest";

import {
  toVehicleAlertHistoryItems,
  VehicleAlertHistoryContractMismatchError,
  VehicleAlertHistoryFetchError,
} from "@/lib/dashboard/vehicles/alert-history-api";

function envelope(content: unknown) {
  return { statusCode: 200, error: null, content };
}

const itemA = {
  alertId: "alert-hist-001-01",
  tireId: "tire-001-fl",
  position: "FL",
  alertLevel: "DANGER",
  alertTitle: "마모도 알림",
  alertTime: "2026.07.18 11:00:00",
};

const itemB = {
  alertId: "alert-hist-001-02",
  tireId: "tire-001-fr",
  position: "FR",
  alertLevel: "WARNING",
  alertTitle: "공기압 알림",
  alertTime: "2026.06.01 10:00:00",
};

describe("toVehicleAlertHistoryItems", () => {
  it("maps a normal envelope response 1:1, preserving the server's given order (AC1)", () => {
    expect(toVehicleAlertHistoryItems(envelope([itemA, itemB]))).toEqual([itemA, itemB]);
  });

  it("does not re-sort a multi-item response (order stays exactly as given)", () => {
    // Deliberately not chronological (itemB's alertTime is earlier than itemA's)
    // to prove the adapter trusts the server's order rather than re-sorting.
    const result = toVehicleAlertHistoryItems(envelope([itemA, itemB]));
    expect(result.map((item) => item.alertId)).toEqual([itemA.alertId, itemB.alertId]);
  });

  it("returns an empty list for 0 alerts (AC3), not an error", () => {
    expect(toVehicleAlertHistoryItems(envelope([]))).toEqual([]);
  });

  it("treats a duplicate alertId as a contract mismatch (AC5)", () => {
    expect(() => toVehicleAlertHistoryItems(envelope([itemA, itemA]))).toThrow(
      VehicleAlertHistoryContractMismatchError,
    );
  });

  it("treats an invalid position enum as a contract mismatch (AC5)", () => {
    expect(() =>
      toVehicleAlertHistoryItems(envelope([{ ...itemA, position: "FRONT_LEFT" }])),
    ).toThrow(VehicleAlertHistoryContractMismatchError);
  });

  it("treats an invalid alertLevel enum as a contract mismatch (AC5)", () => {
    expect(() =>
      toVehicleAlertHistoryItems(envelope([{ ...itemA, alertLevel: "CRITICAL" }])),
    ).toThrow(VehicleAlertHistoryContractMismatchError);
  });

  it("treats a malformed alertTime (ISO instead of KST wire) as a contract mismatch (AC5)", () => {
    expect(() =>
      toVehicleAlertHistoryItems(
        envelope([{ ...itemA, alertTime: "2026-07-18T11:00:00.000Z" }]),
      ),
    ).toThrow(VehicleAlertHistoryContractMismatchError);
  });

  it("treats a missing required field as a contract mismatch (AC5)", () => {
    const { tireId: _tireId, ...withoutTireId } = itemA;
    expect(() => toVehicleAlertHistoryItems(envelope([withoutTireId]))).toThrow(
      VehicleAlertHistoryContractMismatchError,
    );
  });

  it("treats a `content` that is not an array as a contract mismatch (AC5)", () => {
    expect(() => toVehicleAlertHistoryItems(envelope({ alerts: [itemA] }))).toThrow(
      VehicleAlertHistoryContractMismatchError,
    );
  });

  it("treats a response missing `content` as a contract mismatch", () => {
    expect(() => toVehicleAlertHistoryItems({ unexpected: "shape" })).toThrow(
      VehicleAlertHistoryContractMismatchError,
    );
  });

  it("treats a response missing a numeric `statusCode` as a contract mismatch", () => {
    expect(() =>
      toVehicleAlertHistoryItems({ statusCode: "200", error: null, content: [] }),
    ).toThrow(VehicleAlertHistoryContractMismatchError);
  });

  it("treats statusCode !== 200 as a business-failure fetch error, not a contract mismatch", () => {
    expect(() =>
      toVehicleAlertHistoryItems({ statusCode: 500, error: "internal error", content: [] }),
    ).toThrow(VehicleAlertHistoryFetchError);
  });

  it("treats error !== null (even with statusCode 200) as a business-failure fetch error", () => {
    expect(() =>
      toVehicleAlertHistoryItems({ statusCode: 200, error: "unexpected error", content: [] }),
    ).toThrow(VehicleAlertHistoryFetchError);
  });

  it("classifies a 4xx-range statusCode business failure as client-error", () => {
    try {
      toVehicleAlertHistoryItems({ statusCode: 404, error: "not found", content: [] });
      expect.unreachable();
    } catch (caught) {
      expect(caught).toBeInstanceOf(VehicleAlertHistoryFetchError);
      expect((caught as VehicleAlertHistoryFetchError).kind).toBe("client-error");
      expect((caught as VehicleAlertHistoryFetchError).status).toBe(404);
    }
  });

  it("classifies a 5xx-range statusCode business failure as server-error", () => {
    try {
      toVehicleAlertHistoryItems({ statusCode: 503, error: "unavailable", content: [] });
      expect.unreachable();
    } catch (caught) {
      expect(caught).toBeInstanceOf(VehicleAlertHistoryFetchError);
      expect((caught as VehicleAlertHistoryFetchError).kind).toBe("server-error");
    }
  });
});
