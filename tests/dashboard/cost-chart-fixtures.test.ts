import { describe, expect, it } from "vitest";

import {
  COST_CHART_DATASETS_BY_YEAR,
  COST_CHART_YEARS,
  DEFAULT_COST_CHART_YEAR,
} from "@/lib/dashboard/cost-chart/fixtures";

describe("cost-chart fixtures", () => {
  it("has exactly the 2 approved years (2025, 2026), ascending", () => {
    expect(COST_CHART_YEARS).toEqual([2025, 2026]);
  });

  it("defaults to 2026 (Figma-confirmed screen)", () => {
    expect(DEFAULT_COST_CHART_YEAR).toBe(2026);
  });

  it.each(COST_CHART_YEARS)(
    "%i dataset has 12 months (Jan-Dec) with a full lastYearCost line",
    (year) => {
      const dataset = COST_CHART_DATASETS_BY_YEAR[year];

      expect(dataset.points).toHaveLength(12);
      expect(dataset.points.map((point) => point.month)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      for (const point of dataset.points) {
        expect(Number.isFinite(point.lastYearCost)).toBe(true);
        expect(point.lastYearCost).toBeGreaterThan(0);
      }
    },
  );

  it.each(COST_CHART_YEARS)(
    "%i dataset's highlighted month has a defined currentYearCost",
    (year) => {
      const dataset = COST_CHART_DATASETS_BY_YEAR[year];
      const highlighted = dataset.points[dataset.highlightedMonthIndex];

      expect(highlighted).toBeDefined();
      expect(highlighted?.currentYearCost).toBeTypeOf("number");
    },
  );

  it.each(COST_CHART_YEARS)(
    "%i dataset only has currentYearCost up to (and including) the highlighted month, matching the Figma 'current' line stopping at the present month",
    (year) => {
      const dataset = COST_CHART_DATASETS_BY_YEAR[year];

      dataset.points.forEach((point, index) => {
        if (index <= dataset.highlightedMonthIndex) {
          expect(point.currentYearCost).toBeTypeOf("number");
        } else {
          expect(point.currentYearCost).toBeUndefined();
        }
      });
    },
  );

  it("2026 exercises the 'decrease' direction and 2025 exercises 'increase', covering both caret rotations", () => {
    expect(COST_CHART_DATASETS_BY_YEAR[2026].comparisonDirection).toBe(
      "decrease",
    );
    expect(COST_CHART_DATASETS_BY_YEAR[2025].comparisonDirection).toBe(
      "increase",
    );
  });

  it.each(COST_CHART_YEARS)(
    "%i dataset has a positive, integer comparisonPercentage",
    (year) => {
      const dataset = COST_CHART_DATASETS_BY_YEAR[year];

      expect(Number.isInteger(dataset.comparisonPercentage)).toBe(true);
      expect(dataset.comparisonPercentage).toBeGreaterThan(0);
    },
  );
});
