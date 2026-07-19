"use client";

import { useEffect, useState } from "react";
import { Calendar, User } from "lucide-react";

import type { CurrentRental } from "@/types/dashboard/vehicle";
import {
  OVERDUE_REMAINING_LABEL,
  computeRemainingLabel,
  formatKstWireDateLabel,
  parseKstDateTime,
} from "@/lib/dashboard/vehicles/current-rental-api";

type RentedCurrentRental = Extract<CurrentRental, { rented: true }>;

const TICK_INTERVAL_MS = 60_000;

/**
 * Reservation summary card (issue #42, Figma "Reservation Container" node
 * 1:13775, PM 잔여시간 표시 규칙). `VehicleSidePanel` renders this only when
 * `currentRentalQuery.data.rented === true`, so this component never needs
 * its own empty branch.
 *
 * `now` is only ever created on the client (inside `useEffect`) and stays
 * `null` until the first effect runs, so the countdown label is never part
 * of the server-rendered / first client-rendered output — this avoids an
 * SSR/CSR hydration mismatch that a top-level `new Date()` call would cause
 * (PM Scope "new Date() 직접 호출 금지"). A 60s `setInterval` re-ticks `now`
 * and is cleared on unmount.
 */
export function ReservationSummaryCard({ rental }: { rental: RentedCurrentRental }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const intervalId = setInterval(() => setNow(new Date()), TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const endDate = parseKstDateTime(rental.endDate);
  const remainingLabel = now ? computeRemainingLabel(endDate, now) : null;
  const isOverdue = remainingLabel === OVERDUE_REMAINING_LABEL;

  return (
    <div className="rounded-dashboard-banner border border-dashboard-vehicles-border p-4 shadow-dashboard-reservation-card">
      <p
        aria-hidden={remainingLabel === null}
        className={[
          "m-0 text-sm font-semibold",
          remainingLabel === null
            ? "text-transparent"
            : isOverdue
              ? "text-dashboard-tire-warning"
              : "text-dashboard-chart-accent",
        ].join(" ")}
      >
        {remainingLabel ?? " "}
      </p>
      <p className="m-0 mt-2 flex items-center gap-2 text-sm font-medium text-dashboard-account-text">
        <User aria-hidden="true" className="h-4 w-4" />
        {rental.renterName}
      </p>
      <p className="m-0 mt-1 flex items-center gap-2 text-xs text-dashboard-account-text">
        <Calendar aria-hidden="true" className="h-4 w-4" />
        {formatKstWireDateLabel(rental.startDate)} ~ {formatKstWireDateLabel(rental.endDate)}
      </p>
    </div>
  );
}
