import { describe, expect, it } from "vitest";

import {
  formatReservationDateLabel,
  formatReservationStatusBadgeLabel,
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
