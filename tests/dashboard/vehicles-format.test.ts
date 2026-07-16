import { describe, expect, it } from "vitest";

import {
  formatTireStatusLabel,
  formatVehicleDateLabel,
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
