"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { YearlyCostDataset } from "@/types/dashboard/cost-chart";
import {
  COST_CHART_ACCENT_COLOR,
  COST_CHART_AXIS_COLOR,
} from "@/lib/dashboard/cost-chart/chart-colors";

/** 만원 단위 접미사. Figma에 단위 표기가 없어 사용자 승인으로 확정한 값(types/dashboard/cost-chart.ts 참고). */
function formatTenThousandWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}만원`;
}

type MonthTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value: number };
  highlightedMonth: number;
};

/**
 * X축 월 라벨. 강조월(Figma "Months Container", node 2361:23768)만
 * `dashboard-chart-accent` + bold로 표시하고 나머지는 `dashboard-chart-axis`로 표시한다.
 */
function MonthTick({ x, y, payload, highlightedMonth }: MonthTickProps) {
  if (x === undefined || y === undefined || !payload) return null;
  const isHighlighted = payload.value === highlightedMonth;

  return (
    <text
      x={x}
      y={y}
      dy={16}
      textAnchor="middle"
      fontSize={12}
      fontWeight={isHighlighted ? 700 : 400}
      fill={isHighlighted ? COST_CHART_ACCENT_COLOR : COST_CHART_AXIS_COLOR}
    >
      {payload.value}월
    </text>
  );
}

type HighlightTooltipProps = {
  viewBox?: { x?: number; y?: number };
  value: number;
};

/**
 * 강조 포인트 위에 항상 표시되는 정적 값 라벨(Figma node 2361:23766/23767).
 * hover 시에만 나타나는 Recharts 기본 `Tooltip`과 달리, Figma에는 hover 상태가
 * 확인되지 않아(figma-specs "State Coverage") 항상 렌더링되는 정적 라벨로 구현했다.
 */
function HighlightTooltip({ viewBox, value }: HighlightTooltipProps) {
  if (viewBox?.x === undefined || viewBox?.y === undefined) return null;
  const label = formatTenThousandWon(value);
  const width = label.length * 8 + 16;
  const height = 26;

  return (
    <g
      transform={`translate(${viewBox.x - width / 2}, ${viewBox.y - height - 14})`}
      className="drop-shadow-dashboard-tooltip"
    >
      <rect width={width} height={height} rx={8} fill="#ffffff" stroke="#ececf1" />
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={500}
        fill="#1b1b2e"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * `/dashboard` 차량유지보수비 라인(+영역) 차트 (issue #13). Fetch 없이 props로 받은
 * `dataset`만 렌더링하는 순수 presentational 컴포넌트 — 데이터-UI 분리 원칙(CLAUDE.md §4).
 *
 * 스크린 리더에는 의미 있는 정보를 제공하지 않으므로 `aria-hidden`으로 감추고,
 * 동일 데이터를 제공하는 `CostChartAccessibleTable`을 별도로 렌더링한다(Safe Assumption D).
 *
 * `ResponsiveContainer`는 브라우저에서 부모 크기를 측정하므로, SSR HTML과 첫
 * 클라이언트 페인트가 어긋나지 않게 마운트 이후에만 차트를 그린다.
 */
export function CostLineChart({ dataset }: { dataset: YearlyCostDataset }) {
  const [isMounted, setIsMounted] = useState(false);
  const highlightedPoint = dataset.points[dataset.highlightedMonthIndex];
  const highlightedValue = highlightedPoint?.currentYearCost;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div aria-hidden="true" className="h-[236px] w-full">
      {!isMounted ? null : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dataset.points}
            margin={{ top: 40, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid stroke="#ececf1" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={(props) => (
                <MonthTick
                  {...props}
                  highlightedMonth={
                    dataset.points[dataset.highlightedMonthIndex]?.month ?? -1
                  }
                />
              )}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickCount={4}
              width={72}
              tickFormatter={formatTenThousandWon}
              tick={{ fontSize: 12, fill: COST_CHART_AXIS_COLOR }}
            />
            <Area
              type="monotone"
              dataKey="lastYearCost"
              name="전년"
              stroke={COST_CHART_AXIS_COLOR}
              fill={COST_CHART_AXIS_COLOR}
              fillOpacity={0.08}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="currentYearCost"
              name="올해"
              stroke={COST_CHART_ACCENT_COLOR}
              fill={COST_CHART_ACCENT_COLOR}
              fillOpacity={0.12}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {highlightedPoint && highlightedValue !== undefined ? (
              <ReferenceDot
                x={highlightedPoint.month}
                y={highlightedValue}
                r={5}
                fill={COST_CHART_ACCENT_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  content: (props) => (
                    <HighlightTooltip
                      viewBox={props.viewBox as { x?: number; y?: number }}
                      value={highlightedValue}
                    />
                  ),
                }}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
