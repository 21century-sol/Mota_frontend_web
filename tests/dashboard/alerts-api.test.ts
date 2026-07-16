import { describe, expect, it } from "vitest";

import {
  AlertsContractMismatchError,
  formatRelativeTime,
  toAlertItems,
} from "@/lib/dashboard/alerts/api";

const REFERENCE_TIME = new Date("2026-07-16T10:00:00.000Z");

function baseDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "alert-001",
    vehicleId: "vehicle-001",
    vehiclePlateNumber: "12가 3456",
    vehicleModel: "아반떼 하이브리드",
    description: "타이어 온도 90℃ 이상 감지",
    severity: "DANGER",
    occurredAt: "2026-07-16T09:58:00.000Z",
    location: { lat: 37.5665, lng: 126.978 },
    ...overrides,
  };
}

describe("formatRelativeTime", () => {
  it("labels sub-minute gaps as 방금 전", () => {
    expect(
      formatRelativeTime("2026-07-16T09:59:30.000Z", REFERENCE_TIME),
    ).toBe("방금 전");
  });

  it("labels minute-scale gaps as N분 전", () => {
    expect(
      formatRelativeTime("2026-07-16T09:58:00.000Z", REFERENCE_TIME),
    ).toBe("2분 전");
  });

  it("labels hour-scale gaps as N시간 전", () => {
    expect(
      formatRelativeTime("2026-07-16T09:00:00.000Z", REFERENCE_TIME),
    ).toBe("1시간 전");
  });

  it("labels day-scale gaps as N일 전", () => {
    expect(
      formatRelativeTime("2026-07-14T10:00:00.000Z", REFERENCE_TIME),
    ).toBe("2일 전");
  });

  it("clamps a future timestamp (clock skew) to 방금 전 instead of a negative duration", () => {
    expect(
      formatRelativeTime("2026-07-16T10:05:00.000Z", REFERENCE_TIME),
    ).toBe("방금 전");
  });
});

describe("toAlertItems", () => {
  it("maps a bare array response (안 B) to the UI model, exposing plate number only (not model)", () => {
    const result = toAlertItems([baseDto()], REFERENCE_TIME);

    expect(result).toEqual([
      {
        id: "alert-001",
        vehicleId: "vehicle-001",
        vehiclePlateNumber: "12가 3456",
        description: "타이어 온도 90℃ 이상 감지",
        severity: "DANGER",
        occurredAtIso: "2026-07-16T09:58:00.000Z",
        occurredAtLabel: "2분 전",
        location: { lat: 37.5665, lng: 126.978 },
      },
    ]);
    expect(result[0]).not.toHaveProperty("vehicleModel");
    expect(result[0]).not.toHaveProperty("vehicleLabel");
  });

  it("unwraps a checklist-style envelope response (안 A, envelope 미확정)", () => {
    const result = toAlertItems(
      { statusCode: 200, error: null, content: [baseDto()] },
      REFERENCE_TIME,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("alert-001");
  });

  it("returns an empty list for an empty array (AC3 — distinguishable from an error)", () => {
    expect(toAlertItems([], REFERENCE_TIME)).toEqual([]);
  });

  it("treats a missing required field as a contract mismatch", () => {
    const { vehiclePlateNumber: _omit, ...withoutPlate } = baseDto();
    expect(() => toAlertItems([withoutPlate], REFERENCE_TIME)).toThrow(
      AlertsContractMismatchError,
    );
  });

  it("treats an unknown severity value as a contract mismatch", () => {
    expect(() =>
      toAlertItems([baseDto({ severity: "CRITICAL" })], REFERENCE_TIME),
    ).toThrow(AlertsContractMismatchError);
  });

  it("treats an out-of-range latitude as a contract mismatch", () => {
    expect(() =>
      toAlertItems(
        [baseDto({ location: { lat: 200, lng: 126.978 } })],
        REFERENCE_TIME,
      ),
    ).toThrow(AlertsContractMismatchError);
  });

  it("treats an out-of-range longitude as a contract mismatch", () => {
    expect(() =>
      toAlertItems(
        [baseDto({ location: { lat: 37.5665, lng: 999 } })],
        REFERENCE_TIME,
      ),
    ).toThrow(AlertsContractMismatchError);
  });

  it("treats a duplicate alert id as a contract mismatch", () => {
    expect(() =>
      toAlertItems(
        [baseDto(), baseDto({ description: "다른 설명" })],
        REFERENCE_TIME,
      ),
    ).toThrow(AlertsContractMismatchError);
  });

  it("treats a response that is neither a bare array nor a content-array envelope as a contract mismatch", () => {
    expect(() => toAlertItems({ unexpected: "shape" }, REFERENCE_TIME)).toThrow(
      AlertsContractMismatchError,
    );
  });
});
