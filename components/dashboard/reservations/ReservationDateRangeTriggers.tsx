"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ReservationStatus } from "@/types/dashboard/reservation";
import { buildReservationListHref } from "@/lib/dashboard/reservations/url";
import { formatReservationDateLabel } from "@/lib/dashboard/reservations/format";
import { ReservationDatePickerPopover } from "@/components/dashboard/reservations/ReservationDatePickerPopover";

type ReservationDateField = "rented" | "returned";

/**
 * 대여일/반납일 calendar pill triggers + popover (issue #29). Supersedes the
 * #16 no-op version — the #16 PM Non-goal "달력 팝오버는 미구현" was explicitly
 * withdrawn by the #29 PM handoff (`.claude/handoffs/29-pm-breakdown.md`
 * Confirmed Facts).
 *
 * Only one of the two popovers can be open at a time (AC3): `openField` is a
 * single piece of state shared by both triggers rather than two independent
 * booleans. Selecting a date (or clicking "오늘 날짜") writes
 * `rentedOn`/`returnedOn` to the URL via `router.replace` and always resets
 * `page` to 1 — the same "새 필터 → 1페이지" pattern as
 * `ReservationStatusTabs`/`ReservationPagination` — chosen over local state
 * so the date filter survives refresh/back/forward/sharing, consistent with
 * CLAUDE.md §4 URL 상태 rules (a plain date is not personal data). This is
 * the Safe Assumption recorded for PM AC8 ("URL sync 권장하나 강제 아님").
 *
 * Outside-click/Escape-to-close (AC6) is handled once here (not inside
 * `ReservationDatePickerPopover`) via a single `mousedown`/`keydown`
 * listener scoped to `containerRef`, which wraps both trigger buttons —
 * clicking the *other* trigger is therefore never treated as an "outside"
 * click, so switching directly between 대여일/반납일 (AC3) does not require
 * two clicks.
 */
export function ReservationDateRangeTriggers({
  currentStatus,
  rentedOn,
  returnedOn,
}: {
  currentStatus: ReservationStatus | undefined;
  rentedOn: string | undefined;
  returnedOn: string | undefined;
}) {
  const router = useRouter();
  const [openField, setOpenField] = useState<ReservationDateField | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openField) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenField(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenField(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openField]);

  function applySelection(field: ReservationDateField, iso: string) {
    router.replace(
      buildReservationListHref({
        status: currentStatus,
        rentedOn: field === "rented" ? iso : rentedOn,
        returnedOn: field === "returned" ? iso : returnedOn,
      }),
    );
    setOpenField(null);
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          aria-label="대여일 선택"
          aria-haspopup="dialog"
          aria-expanded={openField === "rented"}
          onClick={() => setOpenField((current) => (current === "rented" ? null : "rented"))}
          className="flex items-center gap-2 rounded-full border border-dashboard-vehicles-border bg-white px-4 py-2 text-sm text-dashboard-vehicles-label outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2"
        >
          <Calendar aria-hidden="true" className="h-4 w-4" />
          {rentedOn ? formatReservationDateLabel(rentedOn) : "대여일"}
        </button>
        {openField === "rented" ? (
          <ReservationDatePickerPopover
            label="대여일"
            selectedIso={rentedOn}
            onSelect={(iso) => applySelection("rented", iso)}
            onClose={() => setOpenField(null)}
          />
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="반납일 선택"
          aria-haspopup="dialog"
          aria-expanded={openField === "returned"}
          onClick={() => setOpenField((current) => (current === "returned" ? null : "returned"))}
          className="flex items-center gap-2 rounded-full border border-dashboard-vehicles-border bg-white px-4 py-2 text-sm text-dashboard-vehicles-label outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2"
        >
          <Calendar aria-hidden="true" className="h-4 w-4" />
          {returnedOn ? formatReservationDateLabel(returnedOn) : "반납일"}
        </button>
        {openField === "returned" ? (
          <ReservationDatePickerPopover
            label="반납일"
            selectedIso={returnedOn}
            onSelect={(iso) => applySelection("returned", iso)}
            onClose={() => setOpenField(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
