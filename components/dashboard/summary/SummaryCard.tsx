export type SummaryCardVariant = "dashboard" | "vehicles";

/**
 * Per-variant visual styling.
 *
 * - `dashboard` (default): original `/dashboard` summary card
 *   (Figma file JRL5IHK20Ocs9hfiGus7Xz, node 2361:23653) — 40px light count,
 *   primary-colored label, `shadow-dashboard-card`. Unchanged so `/dashboard`
 *   keeps its existing look.
 * - `vehicles`: `/dashboard/vehicles` card (Figma file nt8U8I48Rcfz8LGNqYvRZv,
 *   node 1:13266) — 32px regular count, muted SemiBold label, softer
 *   `shadow-dashboard-tire-card`, asymmetric pt-20/pb-16 padding. The two
 *   Figma files intentionally diverge, so this is a deliberate branch rather
 *   than a shared value (main-agent decision, 2026-07-18).
 */
const VARIANT_STYLES: Record<
  SummaryCardVariant,
  {
    container: string;
    label: string;
    countRow: string;
    count: string;
    unit: string;
  }
> = {
  dashboard: {
    container:
      "flex flex-col items-start gap-1 rounded-dashboard-card bg-white px-6 py-5 shadow-dashboard-card",
    label: "m-0 text-base font-medium tracking-[-0.4px] text-dashboard-text-primary",
    countRow: "m-0 flex items-center gap-0.5",
    count:
      "text-[40px] font-light leading-[1.5] tracking-[-1px] text-dashboard-text-primary",
    unit: "text-base font-medium tracking-[-0.4px] text-dashboard-text-muted",
  },
  vehicles: {
    container:
      "flex flex-col items-start gap-1 rounded-dashboard-card bg-white px-6 pb-4 pt-5 shadow-dashboard-tire-card",
    label: "m-0 text-base font-semibold tracking-[-0.4px] text-dashboard-text-muted",
    countRow: "m-0 flex items-baseline gap-1",
    count:
      "text-[32px] font-normal leading-[1.5] tracking-[-0.8px] text-dashboard-text-primary",
    unit: "text-base font-medium tracking-[-0.4px] text-dashboard-text-muted",
  },
};

/**
 * Presentational-only. Renders one status card (Figma "Owned/Available/Rented/
 * Unavailable Vehicles Container", node 2361:23653 etc). Deliberately not a
 * `<button>`/`<a>` — click interaction is a documented non-goal (issue #11 AC5).
 *
 * `role="group"` + `aria-label` ensure the label and count are announced together
 * as one unit (AC6), independent of the container's markup — this stays valid even
 * when the container temporarily renders non-card skeleton markup during loading.
 */
export function SummaryCard({
  label,
  count,
  variant = "dashboard",
}: {
  label: string;
  count: number;
  variant?: SummaryCardVariant;
}) {
  const formattedCount = count.toLocaleString("ko-KR");
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role="group"
      aria-label={`${label} ${formattedCount}대`}
      className={styles.container}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.countRow}>
        <span className={styles.count}>{formattedCount}</span>
        <span className={styles.unit}>대</span>
      </p>
    </div>
  );
}
