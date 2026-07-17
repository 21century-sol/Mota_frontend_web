"use client";

import type { ReservationSummaryDto } from "@/types/dashboard/vehicle";
import { VehicleAlertHistoryFetchError } from "@/lib/dashboard/vehicles/alert-history-api";
import { useVehicleAlertHistory } from "@/hooks/dashboard/useVehicleAlertHistory";
import { ReservationSummaryCard } from "@/components/dashboard/vehicles/ReservationSummaryCard";
import { AlertHistoryList } from "@/components/dashboard/vehicles/AlertHistoryList";

/**
 * Right-hand side panel (issue #15, Figma "Sidebar Container", PM AC8-AC11):
 * reservation summary + alert history. `reservation` comes bundled in the
 * `useVehicleDetail` response (`VehicleDetailSection` owns that query); alert
 * history is fetched independently here via `useVehicleAlertHistory`, owning
 * its own loading/empty/error+retry branching (same split as
 * `AlertsAndMapSection`, issue #12).
 */
export function VehicleSidePanel({
  vehicleId,
  reservation,
}: {
  vehicleId: string;
  reservation: ReservationSummaryDto | null;
}) {
  const alertHistoryQuery = useVehicleAlertHistory(vehicleId);
  const alerts = alertHistoryQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 rounded-dashboard-card bg-white p-6 shadow-dashboard-card">
      <section aria-labelledby="vehicle-reservation-heading">
        <h2
          id="vehicle-reservation-heading"
          className="m-0 mb-3 text-sm font-medium text-dashboard-vehicles-label"
        >
          예약 현황
        </h2>
        {reservation ? (
          <ReservationSummaryCard reservation={reservation} />
        ) : (
          <p role="status" className="m-0 py-4 text-sm text-dashboard-vehicles-label">
            현재 예약된 내역이 없습니다.
          </p>
        )}
      </section>

      <section aria-labelledby="vehicle-alert-history-heading">
        <h2
          id="vehicle-alert-history-heading"
          className="m-0 mb-3 text-sm font-medium text-dashboard-vehicles-label"
        >
          알림 이력
        </h2>
        <div aria-busy={alertHistoryQuery.isPending}>
          {alertHistoryQuery.isError ? (
            <div role="alert" className="flex flex-col items-start gap-2 py-4">
              <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
                {alertHistoryQuery.error instanceof VehicleAlertHistoryFetchError
                  ? alertHistoryQuery.error.userMessage
                  : "알림 이력을 불러오지 못했습니다."}
              </p>
              <button
                type="button"
                onClick={() => alertHistoryQuery.refetch()}
                disabled={alertHistoryQuery.isFetching}
                aria-busy={alertHistoryQuery.isFetching}
                className="rounded-full bg-dashboard-sidebar px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {alertHistoryQuery.isFetching ? "다시 시도하는 중..." : "다시 시도"}
              </button>
            </div>
          ) : alertHistoryQuery.isPending ? (
            <p className="m-0 py-4 text-sm text-dashboard-vehicles-label">
              알림 이력을 불러오는 중입니다.
            </p>
          ) : alerts.length === 0 ? (
            <p role="status" className="m-0 py-4 text-sm text-dashboard-vehicles-label">
              확인할 알림이 없습니다.
            </p>
          ) : (
            <AlertHistoryList alerts={alerts} />
          )}
        </div>
      </section>
    </div>
  );
}
