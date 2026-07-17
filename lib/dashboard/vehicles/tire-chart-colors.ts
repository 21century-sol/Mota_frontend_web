/**
 * Recharts renders directly to SVG `stroke` props, which cannot consume
 * Tailwind classes — same rationale as `lib/dashboard/cost-chart/chart-colors.ts`
 * (issue #13). One fixed color per wheel position for the tire status-trend
 * chart (issue #15, PM AC18) so all 4 lines stay visually distinct regardless
 * of which metric is toggled.
 */
export const TIRE_TREND_LINE_COLORS: Record<"FL" | "FR" | "RL" | "RR", string> = {
  FL: "#5a55f2",
  FR: "#16b338",
  RL: "#fb963d",
  RR: "#ff1935",
};

export const TIRE_TREND_AXIS_COLOR = "#b2b2c2";
