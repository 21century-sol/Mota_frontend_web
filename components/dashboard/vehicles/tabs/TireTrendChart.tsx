import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { TireTrendPoint } from "@/types/dashboard/vehicle";
import { WHEEL_POSITIONS } from "@/types/dashboard/vehicle";
import { formatTireTrendDateLabel } from "@/lib/dashboard/vehicles/format";
import {
  TIRE_TREND_AXIS_COLOR,
  TIRE_TREND_GRID_COLOR,
  TIRE_TREND_LEGEND_LABEL_COLOR,
  TIRE_TREND_LINE_COLORS,
} from "@/lib/dashboard/vehicles/tire-chart-colors";

const LINE_DATA_KEYS = {
  FL: "fl",
  FR: "fr",
  RL: "rl",
  RR: "rr",
} as const;

/**
 * 4-line (FL/FR/RL/RR) status-trend chart for one selected metric
 * (Figma "Tire State Chart Container" 1:14009). Pure presentational —
 * `TireStatusTab` owns the metric toggle and swaps `points` accordingly.
 * `connectNulls={false}` so a missing reading shows as a gap.
 */
export function TireTrendChart({ points }: { points: TireTrendPoint[] }) {
  return (
    <>
      <div
        data-testid="tire-trend-chart-visual"
        aria-hidden="true"
        className="pointer-events-none select-none"
      >
        <div className="mb-3 flex justify-end gap-3">
          {WHEEL_POSITIONS.map((position) => (
            <span key={position} className="inline-flex items-center gap-2 text-sm font-medium">
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: TIRE_TREND_LINE_COLORS[position] }}
              />
              <span style={{ color: TIRE_TREND_LEGEND_LABEL_COLOR }}>{position}</span>
            </span>
          ))}
        </div>

        <div className="h-[279px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid
                stroke={TIRE_TREND_GRID_COLOR}
                strokeDasharray="4 4"
                horizontal={false}
                vertical
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string) => formatTireTrendDateLabel(value)}
                tick={{ fontSize: 12, fill: TIRE_TREND_AXIS_COLOR }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={36}
                tick={{ fontSize: 12, fill: TIRE_TREND_AXIS_COLOR }}
              />
              {WHEEL_POSITIONS.map((position) => (
                <Line
                  key={position}
                  type="monotone"
                  dataKey={LINE_DATA_KEYS[position]}
                  name={position}
                  stroke={TIRE_TREND_LINE_COLORS[position]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <table className="sr-only">
        <caption>날짜별 타이어 위치(전좌/전우/후좌/후우) 수치</caption>
        <thead>
          <tr>
            <th scope="col">날짜</th>
            <th scope="col">전좌</th>
            <th scope="col">전우</th>
            <th scope="col">후좌</th>
            <th scope="col">후우</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{formatTireTrendDateLabel(point.date)}</th>
              <td>{point.fl ?? "—"}</td>
              <td>{point.fr ?? "—"}</td>
              <td>{point.rl ?? "—"}</td>
              <td>{point.rr ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
