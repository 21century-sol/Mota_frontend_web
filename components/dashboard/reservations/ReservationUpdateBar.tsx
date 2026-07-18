"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { RESERVATIONS_UPDATED_AT_LABEL } from "@/lib/dashboard/reservations/fixtures";
import { buildReservationListHref } from "@/lib/dashboard/reservations/url";
import { formatReservationUpdatedAtLabel } from "@/lib/dashboard/reservations/format";

/**
 * Update-time text + reset button (issue #16, Figma Confirmed Design Facts:
 * "새로고침/리셋 아이콘 존재: 업데이트 시간 텍스트 옆 원형 버튼"; timestamp behavior decided
 * in #38).
 *
 * `updatedAt` starts `null` and is only set inside a `useEffect` that fires
 * once after mount, never computed during render — a render-time `new
 * Date()` would differ between the server-rendered HTML and the first client
 * render and trigger a hydration mismatch (CLAUDE.md §4 App Router 렌더링
 * 경계). Until that effect commits, the label falls back to the fixed
 * `RESERVATIONS_UPDATED_AT_LABEL` fixture string — identical on the server
 * and the pre-effect client render, so there is nothing for React to warn
 * about — and is then replaced by the real "current" time.
 *
 * PM Safe Assumption A2: since the list is a local fixture, there is no
 * server data to "refresh" — the reset button instead clears the filter
 * state back to 전체/1페이지 (`buildReservationListHref({})`), matching the
 * `lib/dashboard/vehicles/url.ts` filter-reset precedent, while also
 * recording a fresh `updatedAt` so the label still reflects "just clicked".
 * `buildReservationListHref({})` omits every param (including
 * `rentedOn`/`returnedOn`), so this same call already satisfies issue #29
 * AC10 ("리셋 버튼 클릭 시 날짜 필터도 초기화") with no extra logic.
 */
export function ReservationUpdateBar() {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    setUpdatedAt(new Date());
  }, []);

  function handleRefresh() {
    setUpdatedAt(new Date());
    router.replace(buildReservationListHref({}));
  }

  return (
    <div className="flex items-center gap-2 text-sm text-dashboard-placeholder">
      <span>
        {updatedAt ? formatReservationUpdatedAtLabel(updatedAt) : RESERVATIONS_UPDATED_AT_LABEL}
      </span>
      <button
        type="button"
        aria-label="목록 새로고침 (필터 초기화)"
        onClick={handleRefresh}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-dashboard-vehicles-border text-dashboard-placeholder outline-none transition-colors hover:bg-dashboard-vehicles-surface focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2"
      >
        <RotateCcw aria-hidden="true" className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
