import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AlertHistoryTimeFormatError,
  formatAlertCountLabel,
  formatDistanceKmLabel,
  formatKstWireDateTimeLabel,
  formatRentalDurationLabel,
  formatTireStatusLabel,
  formatVehicleDateLabel,
  formatVehicleInfoFuelTypeLabel,
  formatVehicleListDateLabel,
  formatVehicleListRefreshedAtLabel,
  formatVehicleOptionLabel,
  NO_VALUE_PLACEHOLDER,
} from "@/lib/dashboard/vehicles/format";

describe("formatTireStatusLabel", () => {
  it.each([
    ["NORMAL", "정상"],
    ["CAUTION", "주의"],
    ["WARNING", "위험"],
  ] as const)("maps %s to %s", (status, label) => {
    expect(formatTireStatusLabel(status)).toBe(label);
  });

  it("renders the explicit placeholder for null instead of an empty string (AC1)", () => {
    expect(formatTireStatusLabel(null)).toBe(NO_VALUE_PLACEHOLDER);
    expect(formatTireStatusLabel(null)).not.toBe("");
  });
});

describe("formatVehicleDateLabel", () => {
  it("formats an ISO timestamp as YYYY.MM.DD (CLAUDE.md §4)", () => {
    expect(formatVehicleDateLabel("2026-07-01T01:00:00.000Z")).toBe(
      "2026.07.01",
    );
  });

  it("uses UTC date parts so the label doesn't shift with the local timezone", () => {
    expect(formatVehicleDateLabel("2026-01-01T23:30:00.000Z")).toBe(
      "2026.01.01",
    );
  });

  it("renders the explicit placeholder for null instead of an empty string (AC1)", () => {
    expect(formatVehicleDateLabel(null)).toBe(NO_VALUE_PLACEHOLDER);
    expect(formatVehicleDateLabel(null)).not.toBe("");
  });

  it("renders the explicit placeholder for an unparsable string instead of throwing", () => {
    expect(formatVehicleDateLabel("not-a-date")).toBe(NO_VALUE_PLACEHOLDER);
  });
});

describe("formatVehicleListDateLabel", () => {
  it("formats an ISO timestamp as YY.MM.DD (issue #33, vehicle list only)", () => {
    expect(formatVehicleListDateLabel("2026-07-07T09:00:00.000Z")).toBe(
      "26.07.07",
    );
  });

  it("uses UTC date parts so the label doesn't shift with the local timezone", () => {
    expect(formatVehicleListDateLabel("2026-01-01T23:30:00.000Z")).toBe(
      "26.01.01",
    );
  });

  it("renders the explicit placeholder for null instead of an empty string (AC1)", () => {
    expect(formatVehicleListDateLabel(null)).toBe(NO_VALUE_PLACEHOLDER);
    expect(formatVehicleListDateLabel(null)).not.toBe("");
  });

  it("renders the explicit placeholder for an unparsable string instead of throwing", () => {
    expect(formatVehicleListDateLabel("not-a-date")).toBe(NO_VALUE_PLACEHOLDER);
  });
});

describe("formatVehicleListRefreshedAtLabel (issue #35)", () => {
  // Pins the test process's local timezone (not just the system clock) so the
  // local-time getters this formatter intentionally uses (PM Assumption A3)
  // produce a deterministic result regardless of the machine/CI running it.
  beforeEach(() => {
    vi.stubEnv("TZ", "Asia/Seoul");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('formats an ISO timestamp as "업데이트 시간 : YY/MM/DD HH:mm" using local-time getters', () => {
    expect(formatVehicleListRefreshedAtLabel("2026-07-08T11:41:00.000Z")).toBe(
      "업데이트 시간 : 26/07/08 20:41",
    );
  });

  it("renders the explicit placeholder for an unparsable string instead of throwing", () => {
    expect(formatVehicleListRefreshedAtLabel("not-a-date")).toBe(
      `업데이트 시간 : ${NO_VALUE_PLACEHOLDER}`,
    );
  });
});

describe("formatVehicleInfoFuelTypeLabel (issue #42, Car Info panel-only)", () => {
  it.each([
    ["GASOLINE", "가솔린차"],
    ["DIESEL", "디젤차"],
    ["HYBRID", "하이브리드차"],
    ["ELECTRIC", "전기차"],
  ] as const)("maps %s to %s (distinct from the shared formatFuelTypeLabel's '가솔린' etc.)", (type, label) => {
    expect(formatVehicleInfoFuelTypeLabel(type)).toBe(label);
  });
});

describe("formatVehicleOptionLabel (issue #42)", () => {
  it.each([
    ["NAVIGATION", "내비게이션"],
    ["HIPASS", "하이패스"],
    ["BLACKBOX", "블랙박스"],
    ["HEATED_SEAT", "열선 시트"],
    ["SMART_KEY", "스마트키"],
    ["SUNROOF", "선루프"],
    ["VENTILATED_SEAT", "통풍 시트"],
    ["REAR_CAMERA", "후방 카메라"],
  ] as const)("maps %s to %s", (option, label) => {
    expect(formatVehicleOptionLabel(option)).toBe(label);
  });
});

describe("formatKstWireDateTimeLabel (issue #47 AC6)", () => {
  it.each([
    ["2026.07.18 11:00:00", "2026.07.18 오전 11:00"],
    ["2026.07.17 10:01:00", "2026.07.17 오전 10:01"],
    ["2026.07.15 14:30:00", "2026.07.15 오후 02:30"],
    ["2026.07.06 09:05:00", "2026.07.06 오전 09:05"],
    ["2026.07.06 00:07:00", "2026.07.06 오전 12:07"],
    ["2026.07.06 12:00:00", "2026.07.06 오후 12:00"],
  ] as const)("formats %s as %s (12h, 오전/오후, 2-digit pad)", (wireValue, label) => {
    expect(formatKstWireDateTimeLabel(wireValue)).toBe(label);
  });

  it("throws AlertHistoryTimeFormatError for a non-KST-wire value (e.g. ISO)", () => {
    expect(() => formatKstWireDateTimeLabel("2026-07-18T11:00:00.000Z")).toThrow(
      AlertHistoryTimeFormatError,
    );
  });

  it("throws AlertHistoryTimeFormatError for an unparsable string instead of returning a placeholder", () => {
    expect(() => formatKstWireDateTimeLabel("not-a-date")).toThrow(AlertHistoryTimeFormatError);
  });
});

describe("formatRentalDurationLabel (issue #49 AC5)", () => {
  it.each([
    [0, "0시간 0분"],
    [4860, "81시간 0분"],
    [65, "1시간 5분"],
    [3000, "50시간 0분"],
  ] as const)("formats %i minutes as %s (no rounding, no day clamping)", (minutes, label) => {
    expect(formatRentalDurationLabel(minutes)).toBe(label);
  });
});

describe("formatDistanceKmLabel (issue #49 AC6)", () => {
  it.each([
    [312.5, "312.5km"],
    [45.2, "45.2km"],
    [0, "0km"],
  ] as const)("formats %s km as %s (raw decimal, no rounding)", (km, label) => {
    expect(formatDistanceKmLabel(km)).toBe(label);
  });
});

describe("formatAlertCountLabel (issue #49 AC7)", () => {
  it("renders an empty string for null", () => {
    expect(formatAlertCountLabel(null)).toBe("");
  });

  it("renders an empty string for 0 (not the literal '0건')", () => {
    expect(formatAlertCountLabel(0)).toBe("");
  });

  it("renders '{n}건' for a positive count", () => {
    expect(formatAlertCountLabel(3)).toBe("3건");
  });
});
