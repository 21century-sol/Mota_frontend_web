/**
 * Pure calendar-grid helpers for the reservation date-range popover (issue
 * #29, `ReservationDatePickerPopover`). All date math runs in UTC (never
 * local time) so the rendered grid does not shift by a day depending on the
 * machine/CI timezone — the same convention already used by
 * `lib/dashboard/reservations/format.ts`.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fixed "today" anchor for the popover's "오늘 날짜" button and default
 * open-month. The screen has no real server clock (static fixture only,
 * CLAUDE.md §6 forbids `new Date()`/`Date.now()` for fixture data), so a
 * literal date is used instead. `2026-07-16` sits inside the
 * `RESERVATION_FIXTURES` range (2026-07-02–2026-07-27, see
 * `lib/dashboard/reservations/fixtures.ts`), giving both affordances a
 * representative, always-in-range anchor rather than an arbitrary date
 * outside the visible fixture data.
 */
export const RESERVATION_CALENDAR_TODAY_ISO = "2026-07-16";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function getReservationCalendarWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export interface ReservationCalendarYearMonth {
  year: number;
  /** 0-indexed month (0 = 1월), matching the native `Date` convention. */
  month: number;
}

/**
 * Parses a `YYYY-MM-DD` string into its UTC year/month. An unparsable or
 * missing input falls back to {@link RESERVATION_CALENDAR_TODAY_ISO} instead
 * of throwing, so a not-yet-selected trigger can still open on a sensible
 * default month.
 */
export function getYearMonthFromIso(iso: string | undefined): ReservationCalendarYearMonth {
  const source = iso && ISO_DATE_PATTERN.test(iso) ? iso : RESERVATION_CALENDAR_TODAY_ISO;
  const date = new Date(`${source}T00:00:00Z`);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function shiftReservationCalendarMonth(
  { year, month }: ReservationCalendarYearMonth,
  delta: number,
): ReservationCalendarYearMonth {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/** `"YYYY년 M월"` header label (Figma Confirmed Design Facts — no leading zero on the month). */
export function formatReservationCalendarHeaderLabel({
  year,
  month,
}: ReservationCalendarYearMonth): string {
  return `${year}년 ${month + 1}월`;
}

function toIsoDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export type ReservationCalendarCellVariant = "current" | "previous-overflow" | "next-overflow";

export interface ReservationCalendarCell {
  iso: string;
  day: number;
  variant: ReservationCalendarCellVariant;
}

/**
 * Builds a fixed 6×7 (42-cell) month grid starting on Sunday, computed from
 * the real calendar (never copied from the Figma mockup, which has known
 * date typos — see `.claude/handoffs/29-figma-specs.md`). Cells before the
 * 1st of `month` are `"previous-overflow"`; cells after the last day are
 * `"next-overflow"`. Figma confirms an intentionally asymmetric treatment —
 * previous-month overflow is dimmed and visible, next-month overflow is
 * fully hidden — so both variants are exposed for the component to render
 * differently, and the grid is always exactly 42 cells so the popover height
 * never shifts between months.
 */
export function getReservationCalendarCells({
  year,
  month,
}: ReservationCalendarYearMonth): ReservationCalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const previousYearMonth = shiftReservationCalendarMonth({ year, month }, -1);
  const nextYearMonth = shiftReservationCalendarMonth({ year, month }, 1);

  const TOTAL_CELLS = 42;
  const cells: ReservationCalendarCell[] = [];

  for (let index = 0; index < TOTAL_CELLS; index += 1) {
    const dayOffset = index - firstWeekday + 1;

    if (dayOffset < 1) {
      const day = daysInPrevMonth + dayOffset;
      cells.push({
        iso: toIsoDateString(previousYearMonth.year, previousYearMonth.month, day),
        day,
        variant: "previous-overflow",
      });
    } else if (dayOffset > daysInMonth) {
      const day = dayOffset - daysInMonth;
      cells.push({
        iso: toIsoDateString(nextYearMonth.year, nextYearMonth.month, day),
        day,
        variant: "next-overflow",
      });
    } else {
      cells.push({
        iso: toIsoDateString(year, month, dayOffset),
        day: dayOffset,
        variant: "current",
      });
    }
  }

  return cells;
}
