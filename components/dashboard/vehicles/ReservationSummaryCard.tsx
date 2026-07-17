import type { ReservationSummaryDto } from "@/types/dashboard/vehicle";
import { computeReservationSummary } from "@/lib/dashboard/vehicles/detail-api";
import { formatVehicleDateLabel } from "@/lib/dashboard/vehicles/format";

/**
 * Reservation summary card (issue #15, Figma "Reservation Container", PM
 * AC8/AC9). `reservation` is `null` when the vehicle has no in-progress/
 * upcoming reservation — `VehicleSidePanel` renders this component only when
 * non-null and an explicit empty state otherwise, so this component never
 * needs its own null branch.
 *
 * `new Date()` is called here (the render-time caller), not inside
 * `computeReservationSummary` itself — that pure function takes `now` as an
 * explicit parameter so tests can inject a fixed instant.
 */
export function ReservationSummaryCard({
  reservation,
}: {
  reservation: ReservationSummaryDto;
}) {
  const summary = computeReservationSummary(reservation, new Date());

  return (
    <div className="rounded-2xl border border-dashboard-vehicles-border p-4">
      <p className="m-0 text-sm font-semibold text-dashboard-chart-accent">
        반납까지 {summary.daysUntilReturn}일 남았습니다
      </p>
      <p className="m-0 mt-2 text-sm font-medium text-dashboard-vehicles-title">
        {summary.renterName}
      </p>
      <p className="m-0 mt-1 text-xs text-dashboard-vehicles-label">
        {formatVehicleDateLabel(summary.startAt)} ~ {formatVehicleDateLabel(summary.returnAt)}
      </p>
    </div>
  );
}
