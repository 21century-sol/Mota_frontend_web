"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { YearlyCostDataset } from "@/types/dashboard/cost-chart";
import {
  COST_CHART_DATASETS_BY_YEAR,
  COST_CHART_YEARS,
  DEFAULT_COST_CHART_YEAR,
} from "@/lib/dashboard/cost-chart/fixtures";
import { CostChartAccessibleTable } from "@/components/dashboard/cost-chart/CostChartAccessibleTable";
import { CostLineChart } from "@/components/dashboard/cost-chart/CostLineChart";
import { YearSelector } from "@/components/dashboard/cost-chart/YearSelector";

const DIRECTION_LABEL: Record<YearlyCostDataset["comparisonDirection"], string> =
  {
    increase: "증가",
    decrease: "감소",
  };

/**
 * `/dashboard` 차량유지보수비 라인 차트 섹션(issue #13, Figma "Stats Section" node
 * 2361:23748). 선택 연도를 로컬 `useState`로 소유하는 유일한 client 경계 — Recharts가
 * 브라우저 렌더링(SVG 측정)을 필요로 하고 Year Selector가 상호작용을 요구하기 때문
 * (Safe Assumption C, `.claude/handoffs/13-pm-breakdown.md`).
 *
 * 실 비용 API가 이번 이슈 범위 밖(Non-goal)이라 React Query 없이
 * `lib/dashboard/cost-chart/fixtures.ts`를 동기적으로 조회한다 — 네트워크 요청 자체가
 * 없어 loading/error 상태는 N/A(PM handoff AC 참고).
 */
export function CostChartSection() {
  const [selectedYear, setSelectedYear] = useState(DEFAULT_COST_CHART_YEAR);
  const dataset = COST_CHART_DATASETS_BY_YEAR[selectedYear];
  const directionLabel = DIRECTION_LABEL[dataset.comparisonDirection];

  return (
    <section
      aria-labelledby="cost-chart-heading"
      className="relative h-[345px] overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white shadow-dashboard-card"
    >
      <div className="flex h-[60px] items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2">
          <h2
            id="cost-chart-heading"
            className="m-0 text-lg font-normal tracking-[-0.45px] text-black"
          >
            차량유지보수비
          </h2>

          {/*
            방향은 색상이 아니라 캐럿 회전(`scaleY(-1)`)만으로 표시한다(Decision
            Resolved 2026-07-16 #2) — 증가/감소 모두 `dashboard-chart-accent` 단일
            색상. 시각적으로는 회전만으로 전달되므로, 스크린 리더용 명시적 방향 텍스트를
            `role="group"` + `aria-label`로 함께 제공한다(SummaryCard와 동일 관례).
          */}
          <div
            role="group"
            aria-label={`전년대비 ${dataset.comparisonPercentage}% ${directionLabel}`}
            className="flex items-center gap-1"
          >
            <ChevronDown
              aria-hidden="true"
              className={[
                "h-3.5 w-3.5 text-dashboard-chart-accent",
                dataset.comparisonDirection === "increase"
                  ? "[transform:scaleY(-1)]"
                  : "",
              ].join(" ")}
            />
            <span
              aria-hidden="true"
              className="text-sm font-semibold tracking-[0.4px] text-dashboard-chart-accent"
            >
              {dataset.comparisonPercentage}%
            </span>
            <span
              aria-hidden="true"
              className="text-sm tracking-[0.4px] text-black"
            >
              전년대비
            </span>
          </div>
        </div>

        <div className="flex items-center">
          {/*
            "전체보기"는 정적 텍스트만 렌더링한다 — Figma에 상세 화면 디자인이 없어
            클릭 인터랙션·href·목적지를 만들지 않는다(Decision Resolved 2026-07-16 #4,
            AC9).
          */}
          <span className="flex items-center gap-0.5 text-[13px] font-medium tracking-[-0.325px] text-[#99a1ab]">
            전체
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </span>

        </div>
      </div>

      <div className="absolute right-[23px] top-[71px]">
        <YearSelector
          years={COST_CHART_YEARS}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
        />
      </div>

      <div className="absolute left-[39px] right-[39px] top-[94px]">
        <CostLineChart dataset={dataset} />
      </div>
      <CostChartAccessibleTable dataset={dataset} />
    </section>
  );
}
