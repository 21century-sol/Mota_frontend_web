import type { AlertHistoryItem } from "@/types/dashboard/vehicle";
import { formatVehicleDateLabel, formatWheelPositionLabel } from "@/lib/dashboard/vehicles/format";

/**
 * Per-vehicle alert history list (issue #15, Figma "Notification Container",
 * PM AC10). Presentational — assumes a non-empty `alerts` array; loading/
 * empty/error branching is owned by `VehicleSidePanel` (same split as
 * `AlertsList`/`AlertsAndMapSection`, issue #12).
 *
 * A *different* domain/endpoint from `#12`'s dashboard-home `AlertsList`
 * (`lib/dashboard/alerts/**`, protected) — this list is scoped to one vehicle
 * and fetched from `/vehicles/{id}/alerts`, not imported from `#12`.
 *
 * Rendered inside a `max-h` + `overflow-y-auto` container (not a fixed count)
 * per `.claude/handoffs/15-figma-specs.md`'s Safe Assumption: the real count
 * varies per vehicle, reachable via scroll rather than always showing 5.
 */
export function AlertHistoryList({ alerts }: { alerts: AlertHistoryItem[] }) {
  return (
    <ul className="flex max-h-64 flex-col divide-y divide-dashboard-divider overflow-y-auto">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-medium text-dashboard-vehicles-title">
              {alert.tirePosition ? `${formatWheelPositionLabel(alert.tirePosition)}  ` : ""}
              {alert.message}
            </p>
          </div>
          <span className="shrink-0 text-xs text-dashboard-text-tertiary">
            {formatVehicleDateLabel(alert.occurredAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
