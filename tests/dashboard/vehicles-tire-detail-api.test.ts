import { describe, expect, it } from "vitest";

import {
  toVehicleTireDetails,
  VehicleTireDetailContractMismatchError,
} from "@/lib/dashboard/vehicles/tire-detail-api";
import { hasTireNeedingAttention, countTiresNeedingAttention } from "@/lib/dashboard/vehicles/tire";
import type { TireDetail, TireDetailBackendDto } from "@/types/dashboard/vehicle";

/** 실제 백엔드 `TireResponse` 한 바퀴 형태. */
function backendTire(
  position: TireDetailBackendDto["position"],
  status: TireDetailBackendDto["status"],
): TireDetailBackendDto {
  return {
    tireId: `tire-${position}`,
    position,
    status,
    pressure: 32,
    temperature: 24,
    alignment: 0.2,
    wearLevel: 18,
    friction: 0.88,
    expectedReplacementKm: 32_800,
  };
}

/** 백엔드 DTO → 파서가 내보내는 UI 모델(마모 18% → 잔여 32,800km). */
function mappedTire(position: TireDetail["position"], status: TireDetail["status"]): TireDetail {
  return {
    position,
    status,
    expectedReplacementAt: 32_800,
    pressureKpa: 32,
    temperatureCelsius: 24,
    alignmentDeg: 0.2,
    treadDepthMm: 18,
  };
}

const fourBackendNormal = [
  backendTire("FL", "NORMAL"),
  backendTire("FR", "NORMAL"),
  backendTire("RL", "NORMAL"),
  backendTire("RR", "NORMAL"),
];

const fourMappedNormal: TireDetail[] = [
  mappedTire("FL", "NORMAL"),
  mappedTire("FR", "NORMAL"),
  mappedTire("RL", "NORMAL"),
  mappedTire("RR", "NORMAL"),
];

function envelope(content: unknown[]) {
  return { statusCode: 200, error: null, content };
}

describe("toVehicleTireDetails", () => {
  it("maps a normal 4-tire backend array response to the UI model (AC16)", () => {
    expect(toVehicleTireDetails(envelope(fourBackendNormal))).toEqual(fourMappedNormal);
  });

  it("maps missing `status` to NORMAL for older-backend compatibility", () => {
    const noStatus = { tireId: "t", position: "FL", pressure: 1, temperature: 2, alignment: 3, wearLevel: 4 };
    const parsed = toVehicleTireDetails(
      envelope([noStatus, backendTire("FR", "NORMAL"), backendTire("RL", "NORMAL"), backendTire("RR", "NORMAL")]),
    );
    expect(parsed[0].status).toBe("NORMAL");
    // expectedReplacementKm 누락 시 wearLevel로 폴백 계산한다.
    expect(parsed[0].expectedReplacementAt).toBe(Math.round(0.96 * 40_000));
  });

  it("allows every measurement to be null (AC16 null coverage)", () => {
    const nullBackend: TireDetailBackendDto = {
      tireId: "t",
      position: "FL",
      status: "NORMAL",
      pressure: null,
      temperature: null,
      alignment: null,
      wearLevel: null,
      friction: null,
      expectedReplacementKm: null,
    };
    expect(
      toVehicleTireDetails(
        envelope([nullBackend, backendTire("FR", "NORMAL"), backendTire("RL", "NORMAL"), backendTire("RR", "NORMAL")]),
      )[0],
    ).toEqual({
      position: "FL",
      status: "NORMAL",
      expectedReplacementAt: null,
      pressureKpa: null,
      temperatureCelsius: null,
      alignmentDeg: null,
      treadDepthMm: null,
    });
  });

  it("maps expectedReplacementKm from the backend when present", () => {
    const withKm = { ...backendTire("FL", "NORMAL"), wearLevel: 50, expectedReplacementKm: 20_000 };
    const parsed = toVehicleTireDetails(
      envelope([withKm, backendTire("FR", "NORMAL"), backendTire("RL", "NORMAL"), backendTire("RR", "NORMAL")]),
    );
    expect(parsed[0].expectedReplacementAt).toBe(20_000);
    expect(parsed[0].treadDepthMm).toBe(50);
  });

  it("treats fewer than 4 tires as a contract mismatch", () => {
    expect(() => toVehicleTireDetails(envelope([backendTire("FL", "NORMAL")]))).toThrow(
      VehicleTireDetailContractMismatchError,
    );
  });

  it("treats a non-array `content` as a contract mismatch", () => {
    expect(() => toVehicleTireDetails({ statusCode: 200, error: null, content: { tires: [] } })).toThrow(
      VehicleTireDetailContractMismatchError,
    );
  });

  it("treats a duplicate wheel position as a contract mismatch", () => {
    expect(() =>
      toVehicleTireDetails(
        envelope([backendTire("FL", "NORMAL"), backendTire("FL", "NORMAL"), backendTire("RL", "NORMAL"), backendTire("RR", "NORMAL")]),
      ),
    ).toThrow(VehicleTireDetailContractMismatchError);
  });
});

describe("hasTireNeedingAttention / countTiresNeedingAttention (AC15)", () => {
  it("is false when all 4 tires are NORMAL", () => {
    expect(hasTireNeedingAttention(fourMappedNormal)).toBe(false);
    expect(countTiresNeedingAttention(fourMappedNormal)).toBe(0);
  });

  it("is true when at least one tire is CAUTION or WARNING, and counts them", () => {
    const tires = [mappedTire("FL", "CAUTION"), mappedTire("FR", "WARNING"), mappedTire("RL", "NORMAL"), mappedTire("RR", "NORMAL")];
    expect(hasTireNeedingAttention(tires)).toBe(true);
    expect(countTiresNeedingAttention(tires)).toBe(2);
  });

  it("is true for a CAUTION-only boundary case with no WARNING (fixture vehicle-mgmt-007)", () => {
    const tires = [mappedTire("FL", "CAUTION"), mappedTire("FR", "CAUTION"), mappedTire("RL", "CAUTION"), mappedTire("RR", "CAUTION")];
    expect(hasTireNeedingAttention(tires)).toBe(true);
    expect(countTiresNeedingAttention(tires)).toBe(4);
  });
});
