"use client";

import { useRouter } from "next/navigation";

import type { ReservationStatus } from "@/types/dashboard/reservation";
import { buildReservationListHref } from "@/lib/dashboard/reservations/url";

/**
 * Filter tab order/text (Figma Confirmed Design Facts,
 * `.claude/handoffs/16-figma-specs.md`): "전체" / "대여 중" / "반납 완료" — note
 * the tab label has a space ("반납 완료"), unlike the table badge text
 * ("반납완료", no space, see `ReservationStatusBadge`).
 */
const STATUS_TABS: ReadonlyArray<{
  status: ReservationStatus | undefined;
  label: string;
}> = [
  { status: undefined, label: "전체" },
  { status: "RENTED", label: "대여 중" },
  { status: "RETURNED", label: "반납 완료" },
];

/**
 * Reservation status filter tabs (issue #16, PM AC2/AC4, restyled in #38).
 * Selecting a tab writes `?status=` via `router.replace` and always omits
 * `page` — a fresh tab click resets pagination to page 1 (AC4) without
 * needing separate reset logic at the call site (see
 * `buildReservationListHref`).
 *
 * The container's `border-b` spans the full tab row (Figma: a single divider
 * under all tabs, not per-tab). The active indicator is a separate absolutely
 * positioned `h-0.5` bar overlapping that border (`-bottom-px`) rather than a
 * `border-b-2` on the button itself, so it always spans the tab's full
 * padded width instead of hugging the label text, and switching tabs never
 * shifts layout (every tab reserves the same indicator space; only its color
 * changes). `pb-2` keeps the Figma 8px gap between the label and that bar
 * (Figma tab `gap-[8px]`), matching `pt-3` (12px) on top.
 */
export function ReservationStatusTabs({
  currentStatus,
}: {
  currentStatus: ReservationStatus | undefined;
}) {
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="예약 상태 필터"
      className="flex border-b border-dashboard-border"
    >
      {STATUS_TABS.map(({ status, label }) => {
        const isSelected = status === currentStatus;

        return (
          <button
            key={label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              if (isSelected) return;
              router.replace(buildReservationListHref({ status }));
            }}
            className={[
              "relative px-6 pb-2 pt-3 text-base tracking-[-0.4px] outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2",
              isSelected
                ? "font-bold text-dashboard-accent-solid"
                : "font-medium text-dashboard-text-muted hover:text-dashboard-vehicles-title",
            ].join(" ")}
          >
            {label}
            <span
              aria-hidden="true"
              className={[
                "absolute inset-x-0 -bottom-px h-0.5",
                isSelected ? "bg-dashboard-accent-solid" : "bg-transparent",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
