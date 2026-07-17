import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { TireTrendPoint } from "@/types/dashboard/vehicle";
import { formatVehicleDateLabel } from "@/lib/dashboard/vehicles/format";
import { TIRE_TREND_AXIS_COLOR, TIRE_TREND_LINE_COLORS } from "@/lib/dashboard/vehicles/tire-chart-colors";

/**
 * 4-line (전좌/전우/후좌/후우) status-trend chart for one selected metric
 * (issue #15, Figma "Tire State Chart Container", PM AC18). Pure
 * presentational — `TireStatusTab` owns the metric toggle state and swaps
 * `points` accordingly. `connectNulls={false}` so a missing reading shows as
 * a gap rather than a misleading interpolated line.
 *
 * `aria-hidden` + a visually-hidden data table gives screen reader users the
 * same values, matching the `CostLineChart`/`CostChartAccessibleTable`
 * precedent (issue #13).
 */
export function TireTrendChart({ points }: { points: TireTrendPoint[] }) {
  return (
    <>
      <div aria-hidden="true" className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#ececf1" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: string) => formatVehicleDateLabel(value)}
              tick={{ fontSize: 11, fill: TIRE_TREND_AXIS_COLOR }}
            />
            <YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 11, fill: TIRE_TREND_AXIS_COLOR }} />
            <Line
              type="monotone"
              dataKey="fl"
              name="전좌"
              stroke={TIRE_TREND_LINE_COLORS.FL}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="fr"
              name="전우"
              stroke={TIRE_TREND_LINE_COLORS.FR}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rl"
              name="후좌"
              stroke={TIRE_TREND_LINE_COLORS.RL}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rr"
              name="후우"
              stroke={TIRE_TREND_LINE_COLORS.RR}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
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
              <th scope="row">{formatVehicleDateLabel(point.date)}</th>
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
