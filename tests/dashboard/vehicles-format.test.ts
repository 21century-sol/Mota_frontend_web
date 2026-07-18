import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatTireStatusLabel,
  formatVehicleDateLabel,
  formatVehicleListDateLabel,
  formatVehicleListRefreshedAtLabel,
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
