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
}: {
  label: string;
  count: number;
}) {
  const formattedCount = count.toLocaleString("ko-KR");

  return (
    <div
      role="group"
      aria-label={`${label} ${formattedCount}대`}
      className="flex flex-col items-start gap-1 rounded-dashboard-card bg-white px-6 py-5 shadow-dashboard-card"
    >
      <p className="m-0 text-base font-medium tracking-[-0.4px] text-dashboard-text-primary">
        {label}
      </p>
      <p className="m-0 flex items-center gap-0.5">
        <span className="text-[40px] font-light leading-[1.5] tracking-[-1px] text-dashboard-text-primary">
          {formattedCount}
        </span>
        <span className="text-base font-medium tracking-[-0.4px] text-dashboard-text-muted">
          대
        </span>
      </p>
    </div>
  );
}
