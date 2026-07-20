/**
 * Recharts renders directly to SVG `stroke` props, which cannot consume
 * Tailwind classes — same rationale as `lib/dashboard/cost-chart/chart-colors.ts`.
 * Colors match Figma node 1:14009 legend (FL pink, FR purple, RL cyan, RR orange).
 */
export const TIRE_TREND_LINE_COLORS: Record<"FL" | "FR" | "RL" | "RR", string> = {
  FL: "#e6807e",
  FR: "#5a55f2",
  RL: "#5bbad3",
  RR: "#fb963d",
};

export const TIRE_TREND_AXIS_COLOR = "#878a93";

export const TIRE_TREND_GRID_COLOR = "#ececf1";

export const TIRE_TREND_LEGEND_LABEL_COLOR = "#5a5c63";
