"use client";

import { useState } from "react";

import { AlertsFetchError } from "@/lib/dashboard/alerts/api";
import { useAlerts } from "@/hooks/dashboard/useAlerts";
import { AlertsList } from "@/components/dashboard/alerts-map/AlertsList";
import { AlertsListSkeleton } from "@/components/dashboard/alerts-map/AlertsListSkeleton";
import { VehicleMap } from "@/components/dashboard/alerts-map/VehicleMap";

/**
 * `/dashboard` real-time alerts + vehicle map section (issue #12, Figma "Map and
 * Alerts Container" node 2377:23755). Client boundary is required for the
 * `useAlerts` React Query hook and the `selectedAlertId` selection state (PM
 * Safe Assumption A1, `.claude/handoffs/12-pm-breakdown.md`: kept as local
 * `useState`, not URL state — selection is a transient UI concern).
 *
 * Owns loading(skeleton)/empty/error+retry branching for the alerts card (same
 * split as `SummaryCardsSection`, issue #11); `AlertsList` only renders once
 * alerts are known to be a non-empty array.
 */
export function AlertsAndMapSection() {
  const query = useAlerts();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const alerts = query.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <VehicleMap alerts={alerts} selectedAlertId={selectedAlertId} />

      <section
        aria-labelledby="dashboard-alerts-heading"
        className="flex flex-col rounded-dashboard-card bg-white p-6"
      >
        <h2
          id="dashboard-alerts-heading"
          className="m-0 text-lg font-normal tracking-[-0.45px] text-black"
        >
          실시간 알림
        </h2>

        <div className="mt-4" aria-busy={query.isPending}>
          {query.isError ? (
            <div role="alert" className="flex flex-col items-start gap-3 py-4">
              <p className="m-0 text-sm font-medium text-dashboard-text-primary">
                {query.error instanceof AlertsFetchError
                  ? query.error.userMessage
                  : "알림 정보를 불러오지 못했습니다."}
              </p>
              <button
                type="button"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
                aria-busy={query.isFetching}
                className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {query.isFetching ? "다시 시도하는 중..." : "다시 시도"}
              </button>
            </div>
          ) : query.isPending ? (
            <AlertsListSkeleton />
          ) : alerts.length === 0 ? (
            <p className="m-0 py-6 text-center text-sm text-dashboard-text-muted">
              현재 알림이 없습니다.
            </p>
          ) : (
            <AlertsList
              alerts={alerts}
              selectedAlertId={selectedAlertId}
              onSelectAlert={setSelectedAlertId}
            />
          )}
        </div>
      </section>
    </div>
  );
}
