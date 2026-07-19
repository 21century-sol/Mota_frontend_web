"use client";

import { CurrentRentalFetchError } from "@/lib/dashboard/vehicles/current-rental-api";
import { VehicleAlertHistoryFetchError } from "@/lib/dashboard/vehicles/alert-history-api";
import { useVehicleAlertHistory } from "@/hooks/dashboard/useVehicleAlertHistory";
import { useVehicleCurrentRental } from "@/hooks/dashboard/useVehicleCurrentRental";
import { ReservationSummaryCard } from "@/components/dashboard/vehicles/ReservationSummaryCard";
import { AlertHistoryList } from "@/components/dashboard/vehicles/AlertHistoryList";

/**
 * Right-hand side panel (issue #42, Figma "Sidebar Container", nodes
 * 1:13775/1:14540): reservation summary + alert history. Owns its own
 * `useVehicleCurrentRental` query against the separate `/current-rental`
 * endpoint (breaking change from #15, where `reservation` was bundled inside
 * the main detail response and passed down as a prop) — loading/empty
 * (`rented: false`)/error+retry/success are branched explicitly here, same
 * split as the alert history section below.
 */
export function VehicleSidePanel({ vehicleId }: { vehicleId: string }) {
  const currentRentalQuery = useVehicleCurrentRental(vehicleId);
  const alertHistoryQuery = useVehicleAlertHistory(vehicleId);
  const alerts = alertHistoryQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="vehicle-reservation-heading"
        className="rounded-dashboard-card bg-white px-5 pb-4 pt-6 shadow-dashboard-card"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="vehicle-reservation-heading"
            className="m-0 text-lg font-semibold text-dashboard-vehicles-title"
          >
            예약 내역
          </h2>
        </div>
        <div aria-busy={currentRentalQuery.isPending}>
          {currentRentalQuery.isError ? (
            <div role="alert" className="flex flex-col items-start gap-2 py-4">
              <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
                {currentRentalQuery.error instanceof CurrentRentalFetchError
                  ? currentRentalQuery.error.userMessage
                  : "예약 내역을 불러오지 못했습니다."}
              </p>
              <button
                type="button"
                onClick={() => currentRentalQuery.refetch()}
                disabled={currentRentalQuery.isFetching}
                aria-busy={currentRentalQuery.isFetching}
                className="rounded-full bg-dashboard-sidebar px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {currentRentalQuery.isFetching ? "다시 시도하는 중..." : "다시 시도"}
              </button>
            </div>
          ) : currentRentalQuery.isPending ? (
            <p className="m-0 py-4 text-sm text-dashboard-vehicles-label">
              예약 내역을 불러오는 중입니다.
            </p>
          ) : currentRentalQuery.data.rented ? (
            <ReservationSummaryCard rental={currentRentalQuery.data} />
          ) : (
            <p role="status" className="m-0 py-4 text-sm text-dashboard-vehicles-label">
              현재 예약된 내역이 없습니다.
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="vehicle-alert-history-heading"
        className="rounded-dashboard-card bg-white px-5 pb-4 pt-6 shadow-dashboard-card"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="vehicle-alert-history-heading"
            className="m-0 text-lg font-semibold text-dashboard-vehicles-title"
          >
            알림 이력
          </h2>
        </div>
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
            <p role="status" className="m-0 py-4 text-sm tracking-tight text-dashboard-account-text">
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
