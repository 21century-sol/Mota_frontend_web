import type { AlertHistoryItem } from "@/types/dashboard/vehicle";
import { formatKstWireDateTimeLabel } from "@/lib/dashboard/vehicles/format";

/**
 * Per-vehicle alert history list (issue #47, confirmed real backend
 * contract, Figma nodes 1:13810/1:14554). Presentational — assumes a
 * non-empty `alerts` array; loading/empty/error branching is owned by
 * `VehicleSidePanel` (same split as `AlertsList`/`AlertsAndMapSection`,
 * issue #12).
 *
 * A *different* domain/endpoint from `#12`'s dashboard-home `AlertsList`
 * (`lib/dashboard/alerts/**`, protected) — this list is scoped to one vehicle
 * and fetched from `/vehicles/{id}/alerts`, not imported from `#12`.
 *
 * Item content is `"{position} {alertTitle}"` using the raw enum code (e.g.
 * "FL 마모도 알림") — not the Korean `formatWheelPositionLabel` label (PM
 * display rule, `.claude/handoffs/47-api-specs.md` "DTO to UI Model
 * Transformation"). `alertLevel` is validated in the adapter but
 * intentionally never rendered here (no color/icon/badge/text).
 *
 * Rendered inside a `max-h` + `overflow-y-auto` container (not a fixed
 * count) per `.claude/handoffs/15-figma-specs.md`'s Safe Assumption
 * (re-confirmed unchanged by `.claude/handoffs/47-figma-specs.md`): the real
 * count varies per vehicle, reachable via scroll rather than always showing a
 * fixed number of rows.
 */
export function AlertHistoryList({ alerts }: { alerts: AlertHistoryItem[] }) {
  return (
    <ul className="flex max-h-64 flex-col divide-y divide-dashboard-vehicles-border overflow-y-auto">
      {alerts.map((alert) => (
        <li key={alert.alertId} className="flex flex-col items-start gap-1 py-3 pl-0 pr-3">
          <p className="m-0 text-base font-medium tracking-tight text-dashboard-vehicles-title">
              {alert.alertTitle}
          </p>
          <span className="text-sm font-normal tracking-tight text-dashboard-vehicles-label">
            {formatKstWireDateTimeLabel(alert.alertTime)}
          </span>
        </li>
      ))}
    </ul>
  );
}
