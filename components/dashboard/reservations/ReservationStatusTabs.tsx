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
 * Reservation status filter tabs (issue #16, PM AC2/AC4). Selecting a tab
 * writes `?status=` via `router.replace` and always omits `page` — a fresh
 * tab click resets pagination to page 1 (AC4) without needing separate reset
 * logic at the call site (see `buildReservationListHref`).
 */
export function ReservationStatusTabs({
  currentStatus,
}: {
  currentStatus: ReservationStatus | undefined;
}) {
  const router = useRouter();

  return (
    <div role="group" aria-label="예약 상태 필터" className="flex gap-6">
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
              "border-b-2 pb-1 text-sm outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2",
              isSelected
                ? "border-dashboard-accent-solid font-bold text-dashboard-accent-solid"
                : "border-transparent font-medium text-dashboard-text-muted hover:text-dashboard-vehicles-title",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
