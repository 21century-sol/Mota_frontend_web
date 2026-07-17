"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { RESERVATIONS_UPDATED_AT_LABEL } from "@/lib/dashboard/reservations/fixtures";
import { buildReservationListHref } from "@/lib/dashboard/reservations/url";

/**
 * Update-time text + reset button (issue #16, Figma Confirmed Design Facts:
 * "새로고침/리셋 아이콘 존재: 업데이트 시간 텍스트 옆 원형 버튼").
 *
 * PM Safe Assumption A2: since the list is a local fixture, there is no
 * server data to "refresh" — the reset button instead clears the filter
 * state back to 전체/1페이지 (`buildReservationListHref({})`), matching the
 * `lib/dashboard/vehicles/url.ts` filter-reset precedent.
 */
export function ReservationUpdateBar() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-2 text-xs text-dashboard-vehicles-label">
      <span>{RESERVATIONS_UPDATED_AT_LABEL}</span>
      <button
        type="button"
        aria-label="필터 초기화"
        onClick={() => router.replace(buildReservationListHref({}))}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashboard-vehicles-border text-dashboard-vehicles-label outline-none transition-colors hover:bg-dashboard-vehicles-surface focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2"
      >
        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
