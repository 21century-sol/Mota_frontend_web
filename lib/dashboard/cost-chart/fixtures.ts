import type {
  MonthlyCostPoint,
  YearlyCostDataset,
} from "@/types/dashboard/cost-chart";

/**
 * Static demo fixtures for the `/dashboard` vehicle maintenance cost chart
 * (issue #13, Figma trend alignment #57). There is no real cost API yet
 * (PM Non-goal, api-agent skipped — `.claude/handoffs/13-pm-breakdown.md`),
 * so this module is the sole data source and is imported directly by
 * {@link CostChartSection} without any network request, React Query, or MSW.
 *
 * `2026` values are derived from Figma node 1:12117's original SVG paths:
 * - current stroke asset `83ddc50c-2d7e-4a22-91d6-21fc7b30a664`
 * - last stroke asset `8ee25006-d1be-471c-9c0d-30f81e8a0bc9`
 * - current (purple) line stops at July; the authored tooltip fixes July at `1,760`
 * - last (gray) line spans all 12 months and peaks near October
 * - Y domain ticks: 1,000 / 1,500 / 3,000 / 4,500
 * - comparison badge: `22%` 감소
 *
 * When 2025 is selected, its current (purple) series is exactly the gray
 * 2025 series shown in the 2026 view. Its prior-year gray series preserves
 * the same monthly trend at 85% of each value (15% lower).
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

const FIGMA_2025_COSTS = [
  1312, 1468, 1096, 1076, 1392, 1829, 2317, 2567, 2317, 2958, 2323, 2476,
] as const;

const FIGMA_2024_COSTS = FIGMA_2025_COSTS.map((cost) =>
  Math.round(cost * 0.85),
);

/**
 * Values are the monthly samples of the Figma cubic paths, converted through
 * the authored Y-axis positions. July uses the explicit Figma tooltip value.
 */
const COST_CHART_2026 = {
  year: 2026,
  points: buildMonthlyPoints(
    FIGMA_2025_COSTS,
    [956, 1045, 762, 835, 1034, 1288, 1760],
  ),
  highlightedMonthIndex: 6, // 7월 — Figma 강조 포인트 "1,760"
  comparisonPercentage: 22,
  comparisonDirection: "decrease",
} satisfies YearlyCostDataset;

const COST_CHART_2025 = {
  year: 2025,
  points: buildMonthlyPoints(
    FIGMA_2024_COSTS,
    FIGMA_2025_COSTS,
  ),
  highlightedMonthIndex: 11,
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
