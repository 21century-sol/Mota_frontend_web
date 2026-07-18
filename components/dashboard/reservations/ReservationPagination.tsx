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
 *
 * Buttons are square (`rounded-lg`, issue #38 — corrected from an earlier
 * `rounded-full` pill shape). The `pl-6` here pairs with the matching `pl-6`
 * on the sibling count label in `ReservationListPanel` so both halves of the
 * pagination row align to the same left inset as the table above them; the
 * `pr-6` gives the buttons the matching right inset from the table edge
 * (Figma `PageBtns` `px-24`), and the `gap-1.5` matches the Figma 6px
 * button spacing (`PageBtns` `gap-[6px]`).
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
    <nav aria-label="예약 목록 페이지" className="flex gap-1.5 px-6">
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
              "h-[30px] w-[30px] rounded-lg text-xs font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid",
              isCurrent
                ? "bg-dashboard-chart-accent text-white"
                : "border border-dashboard-reservation-page-border bg-white text-black hover:bg-dashboard-vehicles-surface",
            ].join(" ")}
          >
            {pageNumber}
          </button>
        );
      })}
    </nav>
  );
}
