"use client";

import type { VehicleSummaryCounts } from "@/types/dashboard/summary";
import { VehicleSummaryFetchError } from "@/lib/dashboard/summary/api";
import { useSummaryCards } from "@/hooks/dashboard/useSummaryCards";
import {
  SummaryCard,
  type SummaryCardVariant,
} from "@/components/dashboard/summary/SummaryCard";
import { SummaryCardsSkeleton } from "@/components/dashboard/summary/SummaryCardsSkeleton";

const CARD_DEFS: ReadonlyArray<{
  key: keyof VehicleSummaryCounts;
  label: string;
}> = [
  { key: "ownedCount", label: "보유 중인 차량" },
  { key: "availableCount", label: "대여 가능" },
  { key: "rentedCount", label: "대여 중" },
  { key: "unavailableCount", label: "운행 불가" },
];

// No responsive frame exists in Figma for node 2361:23652 (desktop-only, 1132px wide
// row of 4 equal-width cards). PM Assumption A4 / Figma Decision 3
// (.claude/handoffs/11-figma-specs.md, resolved 2026-07-16): reflow with our own
// breakpoints instead of reproducing the fixed-width desktop layout on narrow screens.
// The `vehicles` variant uses the 8px card gap from Figma node 1:13265; `dashboard`
// keeps its original 12px gap.
const GRID_CLASSNAME: Record<SummaryCardVariant, string> = {
  dashboard: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
  vehicles: "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * `/dashboard` summary cards (issue #11). Client boundary is required for the
 * `useSummaryCards` React Query hook; the section itself contains loading,
 * error+retry, and success (including the all-zero case, AC3) branches.
 *
 * Cards are read-only — no click/keyboard interaction is attached (AC5, a
 * documented non-goal), so no button/link semantics are used.
 */
export function SummaryCardsSection({
  variant = "dashboard",
}: {
  variant?: SummaryCardVariant;
} = {}) {
  const query = useSummaryCards();

  return (
    <section aria-labelledby="dashboard-summary-heading">
      <h2 id="dashboard-summary-heading" className="sr-only">
        차량 상태 요약
      </h2>

      {query.isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-dashboard-card bg-white px-6 py-5 shadow-dashboard-card"
        >
          <p className="text-base font-medium text-dashboard-text-primary">
            {query.error instanceof VehicleSummaryFetchError
              ? query.error.userMessage
              : "요약 정보를 불러오지 못했습니다."}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            aria-busy={query.isFetching}
            className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {query.isFetching ? "다시 시도하는 중..." : "다시 시도"}
          </button>
        </div>
      ) : (
        <div aria-busy={query.isPending} className={GRID_CLASSNAME[variant]}>
          {query.isPending ? (
            <SummaryCardsSkeleton variant={variant} />
          ) : (
            CARD_DEFS.map(({ key, label }) => (
              <SummaryCard
                key={key}
                label={label}
                count={query.data[key]}
                variant={variant}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}
