import type {
  MonthlyCostPoint,
  YearlyCostDataset,
} from "@/types/dashboard/cost-chart";

/**
 * Static demo fixtures for the `/dashboard` vehicle maintenance cost chart
 * (issue #13). There is no real cost API yet (PM Non-goal, api-agent skipped —
 * `.claude/handoffs/13-pm-breakdown.md`), so this module is the sole data
 * source and is imported directly by {@link CostChartSection} without any
 * network request, React Query, or MSW handler.
 *
 * `2026` values mirror the exact numbers confirmed in the Figma screenshot
 * (highlighted July value "1,760", "22%" 감소). `2025` has no dedicated Figma
 * frame (Decision Resolved 2026-07-16 #5,
 * `.claude/handoffs/13-figma-specs.md`) — it reuses the same chart
 * component/styles and only supplies different fixture numbers, deliberately
 * varying the highlighted month and using an "increase" comparison so both
 * caret directions are exercised in tests.
 */

function buildMonthlyPoints(
  lastYearCosts: readonly number[],
  currentYearCosts: readonly number[],
): MonthlyCostPoint[] {
  return lastYearCosts.map((lastYearCost, index) => ({
    month: index + 1,
    lastYearCost,
    currentYearCost: currentYearCosts[index],
  }));
}

const COST_CHART_2026 = {
  year: 2026,
  points: buildMonthlyPoints(
    [1200, 1450, 1700, 1950, 2200, 2500, 2800, 3100, 3400, 3700, 3450, 3200],
    [1150, 1300, 1420, 1580, 1690, 1720, 1760],
  ),
  highlightedMonthIndex: 6, // 7월 — Figma 강조 포인트 "1,760"
  comparisonPercentage: 22,
  comparisonDirection: "decrease",
} satisfies YearlyCostDataset;

const COST_CHART_2025 = {
  year: 2025,
  points: buildMonthlyPoints(
    [1000, 1150, 1300, 1450, 1600, 1750, 1900, 2050, 2200, 2350, 2500, 2650],
    [1050, 1250, 1450, 1650, 1850, 2050, 2250, 2450, 2650, 2850, 3050],
  ),
  highlightedMonthIndex: 10, // 11월 — Figma 미제공, 자체 fixture
  comparisonPercentage: 15,
  comparisonDirection: "increase",
} satisfies YearlyCostDataset;

/** Year Selector 기본 선택 연도 (Figma가 확정한 화면 기준). */
export const DEFAULT_COST_CHART_YEAR = COST_CHART_2026.year;

export const COST_CHART_DATASETS_BY_YEAR: Readonly<
  Record<number, YearlyCostDataset>
> = {
  [COST_CHART_2025.year]: COST_CHART_2025,
  [COST_CHART_2026.year]: COST_CHART_2026,
};

/** Year Selector에 오름차순으로 표시할 연도 목록. */
export const COST_CHART_YEARS: readonly number[] = Object.keys(
  COST_CHART_DATASETS_BY_YEAR,
)
  .map(Number)
  .sort((a, b) => a - b);
