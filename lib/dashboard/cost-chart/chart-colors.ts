/**
 * Recharts renders directly to SVG `stroke`/`fill` props, which cannot consume
 * Tailwind classes — so these values are declared here as the single source of
 * truth for `CostLineChart.tsx`'s SVG props, separate from the `dashboard-chart-accent`
 * / `dashboard-chart-axis` Tailwind tokens (`tailwind.config.ts`) used for className-based
 * styling elsewhere in the cost chart. Keep both in sync if the design value changes.
 */
export const COST_CHART_ACCENT_COLOR = "#5a55f2";
export const COST_CHART_AXIS_COLOR = "#b2b2c2";
