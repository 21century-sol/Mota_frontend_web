"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MonthlyCostPoint,
  YearlyCostDataset,
} from "@/types/dashboard/cost-chart";
import {
  COST_CHART_ACCENT_COLOR,
  COST_CHART_AXIS_COLOR,
} from "@/lib/dashboard/cost-chart/chart-colors";

type FigmaAxisPoint = {
  value: number;
  coordinate: number;
};

/**
 * Figma node 1:12117 uses intentionally uneven Y-axis spacing:
 * 4,500(y=9), 3,000(y=67), 1,500(y=125), 1,000(y=163), baseline(y=190).
 * Recharts uses a linear axis, so values are converted to equivalent linear
 * chart coordinates while the accessible dataset keeps the real cost values.
 */
const FIGMA_AXIS_POINTS: readonly FigmaAxisPoint[] = [
  { value: 0, coordinate: 0 },
  { value: 1000, coordinate: 671 },
  { value: 1500, coordinate: 1616 },
  { value: 3000, coordinate: 3058 },
  { value: 4500, coordinate: 4500 },
];

const FIGMA_VISIBLE_TICKS = FIGMA_AXIS_POINTS.slice(1);

const FIGMA_LAST_LINE_PATH =
  "M1.25 73.25C50.45 73.25 50.45 61.25 99.65 61.25C148.85 61.25 148.85 91.25 198.05 91.25C247.25 91.25 247.25 91.25 296.45 91.25C345.65 91.25 345.65 59.25 394.85 59.25C444.05 59.25 444.05 37.25 493.25 37.25C542.45 37.25 542.45 13.25 591.65 13.25C640.85 13.25 640.85 31.25 690.05 31.25C739.25 31.25 739.25 1.25 788.45 1.25C837.65 1.25 837.65 27.25 886.85 27.25C936.05 27.25 936.05 21.25 985.25 21.25";

const FIGMA_LAST_AREA_PATH =
  "M0 72C49.25 72 49.25 60 98.5 60C147.75 60 147.75 90 197 90C246.25 90 246.25 90 295.5 90C344.75 90 344.75 58 394 58C443.25 58 443.25 36 492.5 36C541.75 36 541.75 12 591 12C640.25 12 640.25 30 689.5 30C738.75 30 738.75 0 788 0C837.25 0 837.25 26 886.5 26C935.75 26 935.75 20 985 20V124H0V72Z";

const FIGMA_CURRENT_LINE_PATH =
  "M1.25 53.3723C49.9213 53.3723 51.2593 46.4227 99.9306 46.4227C148.602 46.4227 149.104 70.25 197.775 70.25C246.446 70.25 247.115 60.3207 295.786 60.3207C344.458 60.3207 358.173 32.027 406.844 32.027C455.515 32.027 473.579 1.25 522.25 1.25";

const FIGMA_CURRENT_AREA_PATH =
  "M97.3843 46.8466C48.6922 46.8466 48.6922 52.6878 0 52.6878V78H522V0C473.308 0 456.086 31.5 407.394 31.5C358.702 31.5 342.317 60 293.625 60C244.933 60 248.625 70.5 199.933 70.5C151.241 70.5 146.076 46.8466 97.3843 46.8466Z";

type ChartShapePoint = {
  x: number | null;
  y: number | null;
};

type ChartShapeProps = {
  points?: ReadonlyArray<ChartShapePoint>;
};

type PositionedChartPoint = {
  x: number;
  y: number;
};

function hasPosition(point: ChartShapePoint): point is PositionedChartPoint {
  return point.x !== null && point.y !== null;
}

function getShapeEndpoints(
  points: ReadonlyArray<ChartShapePoint> | undefined,
): readonly [PositionedChartPoint, PositionedChartPoint] | null {
  const positionedPoints = points?.filter(hasPosition) ?? [];
  const first = positionedPoints[0];
  const last = positionedPoints[positionedPoints.length - 1];

  return first && last ? [first, last] : null;
}

function renderFigmaFullYearShape(
  points: ReadonlyArray<ChartShapePoint> | undefined,
  stroke: string,
  fill: string,
) {
  const endpoints = getShapeEndpoints(points);
  if (!endpoints) return null;

  const [first, last] = endpoints;
  const scaleX = (last.x - first.x) / (985.25 - 1.25);
  const scaleY = (last.y - first.y) / (21.25 - 73.25);
  const translateX = first.x - scaleX * 1.25;
  const translateY = first.y - scaleY * 73.25;
  const areaScaleX = (last.x - first.x) / 985;
  const areaTranslateY = first.y - scaleY * 72;

  return (
    <g>
      <path
        d={FIGMA_LAST_AREA_PATH}
        transform={`matrix(${areaScaleX} 0 0 ${scaleY} ${first.x} ${areaTranslateY})`}
        fill={fill}
        stroke="none"
      />
      <path
        d={FIGMA_LAST_LINE_PATH}
        transform={`matrix(${scaleX} 0 0 ${scaleY} ${translateX} ${translateY})`}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function FigmaLastLineShape({ points }: ChartShapeProps) {
  return renderFigmaFullYearShape(
    points,
    "#d3d3d3",
    "url(#cost-chart-last-fill)",
  );
}

function FigmaCurrentFullYearShape({ points }: ChartShapeProps) {
  return renderFigmaFullYearShape(
    points,
    COST_CHART_ACCENT_COLOR,
    "url(#cost-chart-current-fill)",
  );
}

function FigmaCurrentAreaShape({ points }: ChartShapeProps) {
  const endpoints = getShapeEndpoints(points);
  if (!endpoints) return null;

  const [first, last] = endpoints;
  const figmaLastX = last.x - 12;
  const strokeScaleX = (figmaLastX - first.x) / (522.25 - 1.25);
  const strokeScaleY = (last.y - first.y) / (1.25 - 53.3723);
  const strokeTranslateX = first.x - strokeScaleX * 1.25;
  const strokeTranslateY = first.y - strokeScaleY * 53.3723;

  const areaScaleX = (figmaLastX - first.x) / 522;
  const areaTranslateY = first.y - strokeScaleY * 52.6878;

  return (
    <g>
      <path
        d={FIGMA_CURRENT_AREA_PATH}
        transform={`matrix(${areaScaleX} 0 0 ${strokeScaleY} ${first.x} ${areaTranslateY})`}
        fill="url(#cost-chart-current-fill)"
        stroke="none"
      />
      <path
        d={FIGMA_CURRENT_LINE_PATH}
        transform={`matrix(${strokeScaleX} 0 0 ${strokeScaleY} ${strokeTranslateX} ${strokeTranslateY})`}
        fill="none"
        stroke={COST_CHART_ACCENT_COLOR}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function toFigmaChartCoordinate(value: number): number {
  const upperIndex = FIGMA_AXIS_POINTS.findIndex(
    (point) => point.value >= value,
  );

  if (upperIndex === -1) {
    return FIGMA_AXIS_POINTS[FIGMA_AXIS_POINTS.length - 1].coordinate;
  }

  if (upperIndex === 0) {
    return FIGMA_AXIS_POINTS[0].coordinate;
  }

  const lower = FIGMA_AXIS_POINTS[upperIndex - 1];
  const upper = FIGMA_AXIS_POINTS[upperIndex];
  const ratio = (value - lower.value) / (upper.value - lower.value);

  return lower.coordinate + ratio * (upper.coordinate - lower.coordinate);
}

function formatFigmaAxisValue(coordinate: number): string {
  const point = FIGMA_VISIBLE_TICKS.find(
    (candidate) => candidate.coordinate === coordinate,
  );

  return point ? point.value.toLocaleString("ko-KR") : "";
}

function getLastYearChartValue(point: MonthlyCostPoint): number {
  return toFigmaChartCoordinate(point.lastYearCost);
}

function getCurrentYearChartValue(
  point: MonthlyCostPoint,
): number | undefined {
  return point.currentYearCost === undefined
    ? undefined
    : toFigmaChartCoordinate(point.currentYearCost);
}

type MonthTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value: number };
  highlightedMonth: number;
};

function MonthTick({ x, y, payload, highlightedMonth }: MonthTickProps) {
  if (x === undefined || y === undefined || !payload) return null;
  const isHighlighted = payload.value === highlightedMonth;

  return (
    <text
      x={x}
      y={y}
      dy={16}
      textAnchor="middle"
      fontSize={14}
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

function HighlightTooltip({ viewBox, value }: HighlightTooltipProps) {
  if (viewBox?.x === undefined || viewBox?.y === undefined) return null;
  const label = value.toLocaleString("ko-KR");
  const width = 66;
  const height = 38;

  return (
    <g
      transform={`translate(${viewBox.x - width / 2}, ${viewBox.y - height - 14})`}
      className="drop-shadow-dashboard-tooltip"
    >
      <rect width={width} height={height} rx={11} fill="#ffffff" stroke="#ececf1" />
      <text
        x={width / 2}
        y={height / 2 + 6}
        textAnchor="middle"
        fontSize={18}
        fontWeight={500}
        fill="#1b1b2e"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * `/dashboard` 차량유지보수비 차트(issue #57).
 * Figma 원본 SVG 곡선에서 역산한 실제 비용은 fixture가 소유하고, 이 컴포넌트는
 * Figma의 비선형 Y축 간격만 렌더링 좌표로 변환한다.
 */
export function CostLineChart({ dataset }: { dataset: YearlyCostDataset }) {
  const [isMounted, setIsMounted] = useState(false);
  const highlightedPoint = dataset.points[dataset.highlightedMonthIndex];
  const highlightedValue = highlightedPoint?.currentYearCost;
  const highlightedMonth = highlightedPoint?.month;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none h-[236px] w-full select-none"
    >
      {!isMounted ? null : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dataset.points}
            margin={{ top: 9, right: 11, left: 0, bottom: 15 }}
          >
            <defs>
              <linearGradient
                id="cost-chart-last-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#cccccc" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#cccccc" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="cost-chart-current-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={COST_CHART_ACCENT_COLOR}
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor={COST_CHART_ACCENT_COLOR}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#ececf1"
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={(props) => (
                <MonthTick
                  {...props}
                  highlightedMonth={highlightedMonth ?? -1}
                />
              )}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 4500]}
              ticks={FIGMA_VISIBLE_TICKS.map((point) => point.coordinate)}
              interval={0}
              width={42}
              tickFormatter={formatFigmaAxisValue}
              tick={{ fontSize: 12, fill: COST_CHART_AXIS_COLOR }}
            />

            <Line
              type="monotone"
              dataKey={getLastYearChartValue}
              name="전년"
              stroke="#d3d3d3"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              shape={dataset.year === 2026 ? FigmaLastLineShape : undefined}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey={getCurrentYearChartValue}
              name="올해"
              stroke={COST_CHART_ACCENT_COLOR}
              fill="url(#cost-chart-current-fill)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              connectNulls={false}
              shape={
                dataset.year === 2026
                  ? FigmaCurrentAreaShape
                  : FigmaCurrentFullYearShape
              }
              isAnimationActive={false}
            />

            {dataset.year === 2026 && highlightedMonth !== undefined ? (
              <ReferenceLine
                x={highlightedMonth}
                transform="translate(-12 0)"
                stroke={COST_CHART_ACCENT_COLOR}
                strokeOpacity={0.45}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            ) : null}
            {dataset.year === 2026 &&
            highlightedPoint &&
            highlightedValue !== undefined ? (
              <ReferenceDot
                x={highlightedPoint.month}
                y={toFigmaChartCoordinate(highlightedValue)}
                transform="translate(-12 0)"
                r={5.5}
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
