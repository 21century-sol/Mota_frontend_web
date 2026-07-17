"use client";

import { useRouter } from "next/navigation";

import type { ReservationStatus } from "@/types/dashboard/reservation";
import { buildReservationListHref } from "@/lib/dashboard/reservations/url";

/**
 * Numeric pagination (1, 2, 3…) — Figma Confirmed Design Facts: "숫자
 * pill만(화살표 없음), 활성 `bg-[#5a55f2]` 흰 텍스트" — the active-page background
 * reuses `dashboard-chart-accent` (`#5a55f2`, issue #13), a confirmed hex
 * match, unlike the badge colors in `ReservationStatusBadge`. Same numeric
 * pattern as `UsageHistoryTab`'s `UsagePagination` (issue #15).
 */
export function ReservationPagination({
  currentStatus,
  currentPage,
  totalPages,
}: {
  currentStatus: ReservationStatus | undefined;
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="예약 목록 페이지" className="flex gap-1">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
        const isCurrent = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            onClick={() =>
              router.replace(
                buildReservationListHref({ status: currentStatus, page: pageNumber }),
              )
            }
            className={[
              "h-8 w-8 rounded-full text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid",
              isCurrent
                ? "bg-dashboard-chart-accent text-white"
                : "border border-dashboard-reservation-page-border text-dashboard-vehicles-label hover:bg-dashboard-vehicles-surface",
            ].join(" ")}
          >
            {pageNumber}
          </button>
        );
      })}
    </nav>
  );
}
