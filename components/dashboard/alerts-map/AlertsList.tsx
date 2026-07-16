"use client";

import { AlertTriangle } from "lucide-react";

import type { AlertItem, AlertSeverity } from "@/types/dashboard/alerts";

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { bg: string; icon: string; label: string }
> = {
  // Icon glyph hex is an estimate (Decision Resolved 2026-07-16 #2,
  // `.claude/handoffs/12-figma-specs.md` — vector source not exported).
  DANGER: { bg: "bg-dashboard-alert-danger-bg", icon: "text-[#fe3d16]", label: "위험" },
  CAUTION: { bg: "bg-dashboard-alert-warning-bg", icon: "text-[#ff8a00]", label: "주의" },
};

/**
 * Presentational alert list (issue #12). Assumes a non-empty `alerts` array —
 * loading/empty/error+retry branching is owned by `AlertsAndMapSection`
 * (same split as `SummaryCardsSection`/`SummaryCard`, issue #11).
 *
 * Each item is a real `<button>` so click and keyboard (Enter/Space) selection
 * come for free (AC5). Severity is exposed through `aria-label` text (not just
 * icon color) so screen reader users can distinguish 위험/주의 without relying on
 * color alone (CLAUDE.md §4 accessibility rules).
 */
export function AlertsList({
  alerts,
  selectedAlertId,
  onSelectAlert,
}: {
  alerts: AlertItem[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
}) {
  return (
    <ul className="flex flex-col divide-y divide-dashboard-divider">
      {alerts.map((alert) => {
        const isSelected = alert.id === selectedAlertId;
        const palette = SEVERITY_STYLES[alert.severity];

        return (
          <li key={alert.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              aria-label={`${palette.label} 알림, ${alert.vehiclePlateNumber}, ${alert.description}, ${alert.occurredAtLabel}${isSelected ? ", 선택됨" : ""}`}
              onClick={() => onSelectAlert(alert.id)}
              className={[
                "flex w-full items-center gap-3 px-1 py-3 text-left outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-dashboard-chart-accent focus-visible:ring-offset-2",
                isSelected ? "bg-dashboard-surface" : "hover:bg-dashboard-surface/60",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${palette.bg}`}
              >
                <AlertTriangle aria-hidden="true" className={`h-4 w-4 ${palette.icon}`} />
              </span>

              <span aria-hidden="true" className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-black">
                  {alert.vehiclePlateNumber}
                </span>
                <span className="block truncate text-xs text-[#737a87]">
                  {alert.description}
                </span>
              </span>

              <span
                aria-hidden="true"
                className="shrink-0 text-[10px] text-dashboard-text-tertiary"
              >
                {alert.occurredAtLabel}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
