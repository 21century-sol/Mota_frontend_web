import { describe, expect, it } from "vitest";

import {
  RESERVATION_CALENDAR_TODAY_ISO,
  formatReservationCalendarHeaderLabel,
  getReservationCalendarCells,
  getReservationCalendarWeekdayLabels,
  getYearMonthFromIso,
  shiftReservationCalendarMonth,
} from "@/lib/dashboard/reservations/date";

describe("getYearMonthFromIso (issue #29)", () => {
  it("parses a valid YYYY-MM-DD into its UTC year/month", () => {
    expect(getYearMonthFromIso("2026-07-16")).toEqual({ year: 2026, month: 6 });
  });

  it("falls back to the fixed reference today for an undefined input", () => {
    expect(getYearMonthFromIso(undefined)).toEqual(
      getYearMonthFromIso(RESERVATION_CALENDAR_TODAY_ISO),
    );
  });

  it("falls back to the fixed reference today for a malformed input instead of throwing", () => {
    expect(getYearMonthFromIso("not-a-date")).toEqual(
      getYearMonthFromIso(RESERVATION_CALENDAR_TODAY_ISO),
    );
  });
});

describe("shiftReservationCalendarMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftReservationCalendarMonth({ year: 2026, month: 6 }, 1)).toEqual({
      year: 2026,
      month: 7,
    });
  });

  it("rolls over to the next year in December", () => {
    expect(shiftReservationCalendarMonth({ year: 2026, month: 11 }, 1)).toEqual({
      year: 2027,
      month: 0,
    });
  });

  it("rolls back to the previous year in January", () => {
    expect(shiftReservationCalendarMonth({ year: 2026, month: 0 }, -1)).toEqual({
      year: 2025,
      month: 11,
    });
  });
});

describe("formatReservationCalendarHeaderLabel", () => {
  it("formats as '<year>년 <month>월' with no leading zero on the month", () => {
    expect(formatReservationCalendarHeaderLabel({ year: 2026, month: 6 })).toBe("2026년 7월");
    expect(formatReservationCalendarHeaderLabel({ year: 2026, month: 0 })).toBe("2026년 1월");
  });
});

describe("getReservationCalendarWeekdayLabels", () => {
  it("returns 일 월 화 수 목 금 토 in order", () => {
    expect(getReservationCalendarWeekdayLabels()).toEqual([
      "일",
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
    ]);
  });
});

describe("getReservationCalendarCells (issue #29 — real date math, not the Figma mockup's typo'd values)", () => {
  it("always returns exactly 42 cells (6x7)", () => {
    expect(getReservationCalendarCells({ year: 2026, month: 6 })).toHaveLength(42);
  });

  it("2026년 7월 (July 2026) starts on a Wednesday, so the first 3 cells are previous-month overflow (28, 29, 30 June)", () => {
    const cells = getReservationCalendarCells({ year: 2026, month: 6 });
    expect(cells.slice(0, 3)).toEqual([
      { iso: "2026-06-28", day: 28, variant: "previous-overflow" },
      { iso: "2026-06-29", day: 29, variant: "previous-overflow" },
      { iso: "2026-06-30", day: 30, variant: "previous-overflow" },
    ]);
    expect(cells[3]).toEqual({ iso: "2026-07-01", day: 1, variant: "current" });
  });

  it("marks the last day of the month correctly and everything after it as next-month overflow", () => {
    const cells = getReservationCalendarCells({ year: 2026, month: 6 });
    const july31 = cells.find((cell) => cell.iso === "2026-07-31");
    expect(july31).toEqual({ iso: "2026-07-31", day: 31, variant: "current" });

    const augustOverflow = cells.filter((cell) => cell.variant === "next-overflow");
    expect(augustOverflow.length).toBeGreaterThan(0);
    for (const cell of augustOverflow) {
      expect(cell.iso.startsWith("2026-08-")).toBe(true);
    }
  });

  it("handles a December → January month-boundary correctly", () => {
    const cells = getReservationCalendarCells({ year: 2026, month: 11 });
    const jan1 = cells.find((cell) => cell.day === 1 && cell.variant === "next-overflow");
    expect(jan1?.iso).toBe("2027-01-01");
  });
});
