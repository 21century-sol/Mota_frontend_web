import { describe, expect, it } from "vitest";

import {
  formatReservationDateLabel,
  formatReservationStatusBadgeLabel,
  formatReservationUpdatedAtLabel,
} from "@/lib/dashboard/reservations/format";

describe("formatReservationDateLabel", () => {
  it("formats an ISO date as YY.MM.DD (2-digit year, matching the confirmed Figma copy)", () => {
    expect(formatReservationDateLabel("2026-07-19")).toBe("26.07.19");
  });

  it("pads single-digit month/day", () => {
    expect(formatReservationDateLabel("2026-01-05")).toBe("26.01.05");
  });

  it("returns a placeholder for an unparseable date instead of throwing", () => {
    expect(formatReservationDateLabel("not-a-date")).toBe("-");
  });
});

describe("formatReservationStatusBadgeLabel", () => {
  it("uses '반납완료' (no space) for RETURNED, distinct from the tab label '반납 완료'", () => {
    expect(formatReservationStatusBadgeLabel("RETURNED")).toBe("반납완료");
  });

  it("uses '대여 중' (with space) for RENTED", () => {
    expect(formatReservationStatusBadgeLabel("RENTED")).toBe("대여 중");
  });
});

describe("formatReservationUpdatedAtLabel", () => {
  it("formats a local Date as 'YY/MM/DD HH:mm' with zero-padding", () => {
    expect(formatReservationUpdatedAtLabel(new Date(2026, 0, 5, 3, 7))).toBe(
      "업데이트 시간 : 26/01/05 03:07",
    );
  });

  it("handles a 2-digit year rollover at century boundaries", () => {
    expect(formatReservationUpdatedAtLabel(new Date(2000, 0, 1, 0, 0))).toBe(
      "업데이트 시간 : 00/01/01 00:00",
    );
    expect(formatReservationUpdatedAtLabel(new Date(2099, 11, 31, 23, 59))).toBe(
      "업데이트 시간 : 99/12/31 23:59",
    );
  });
});
