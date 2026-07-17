"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  RESERVATION_CALENDAR_TODAY_ISO,
  formatReservationCalendarHeaderLabel,
  getReservationCalendarCells,
  getReservationCalendarWeekdayLabels,
  getYearMonthFromIso,
  shiftReservationCalendarMonth,
} from "@/lib/dashboard/reservations/date";

const WEEKDAY_LABELS = getReservationCalendarWeekdayLabels();

/**
 * Calendar popover for the 대여일/반납일 triggers (issue #29, Figma node
 * `1:12762` "달력", `.claude/handoffs/29-figma-specs.md`). A controlled leaf:
 * it owns only the displayed month (resets whenever the parent remounts it
 * via `key`, see `ReservationDateRangeTriggers`) — the actual selected value
 * and open/closed state live in the parent, which is also responsible for
 * outside-click/Escape handling since it must coordinate both triggers
 * (AC3: only one popover open at a time).
 */
export function ReservationDatePickerPopover({
  label,
  selectedIso,
  onSelect,
  onClose,
}: {
  label: string;
  selectedIso: string | undefined;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const [yearMonth, setYearMonth] = useState(() => getYearMonthFromIso(selectedIso));
  const cells = getReservationCalendarCells(yearMonth);

  return (
    <div
      role="dialog"
      aria-label={`${label} 달력`}
      className="absolute left-0 top-full z-20 mt-2 flex w-80 min-h-[368px] flex-col rounded-dashboard-card bg-white p-5 shadow-dashboard-popover"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setYearMonth((current) => shiftReservationCalendarMonth(current, -1))}
          className="flex h-6 w-6 items-center justify-center rounded-full text-dashboard-reservation-calendar-text outline-none hover:bg-dashboard-vehicles-surface focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <p className="m-0 text-sm text-dashboard-usage-text">
          {formatReservationCalendarHeaderLabel(yearMonth)}
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setYearMonth((current) => shiftReservationCalendarMonth(current, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-full text-dashboard-reservation-calendar-text outline-none hover:bg-dashboard-vehicles-surface focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 border-b border-dashboard-vehicles-border" />

      <div className="mt-3 grid grid-cols-7 justify-items-center">
        {WEEKDAY_LABELS.map((weekday) => (
          <span
            key={weekday}
            className="flex h-6 w-6 items-center justify-center text-[10px] uppercase text-dashboard-reservation-calendar-weekday"
          >
            {weekday}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 justify-items-center gap-y-4">
        {cells.map((cell) => {
          if (cell.variant === "next-overflow") {
            // Figma: 다음 달 오버플로우는 완전 숨김. `invisible` keeps the grid
            // cell's layout space so the 6-row grid never reflows, while
            // hiding both the value and click target.
            return <span key={cell.iso} aria-hidden="true" className="invisible h-6 w-6" />;
          }

          if (cell.variant === "previous-overflow") {
            return (
              <span
                key={cell.iso}
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center text-sm text-dashboard-placeholder"
              >
                {cell.day}
              </span>
            );
          }

          const isSelected = cell.iso === selectedIso;

          return (
            <button
              key={cell.iso}
              type="button"
              aria-pressed={isSelected}
              aria-label={cell.iso}
              onClick={() => onSelect(cell.iso)}
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-sm outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-1",
                isSelected
                  ? "bg-dashboard-accent-solid text-white"
                  : "text-dashboard-reservation-calendar-text hover:bg-dashboard-vehicles-surface",
              ].join(" ")}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={() => onSelect(RESERVATION_CALENDAR_TODAY_ISO)}
          className="rounded-lg border border-dashboard-vehicles-border px-3 py-1.5 text-xs text-dashboard-reservation-calendar-text outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid"
        >
          오늘 날짜
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-dashboard-vehicles-border px-3 py-1.5 text-xs text-dashboard-reservation-calendar-text outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
