"use client";

import { useEffect, useState } from "react";

import type { CurrentRental } from "@/types/dashboard/vehicle";
import {
  OVERDUE_REMAINING_LABEL,
  computeRemainingLabel,
  formatKstWireDateLabel,
  parseKstDateTime,
} from "@/lib/dashboard/vehicles/current-rental-api";

type RentedCurrentRental = Extract<CurrentRental, { rented: true }>;

const TICK_INTERVAL_MS = 60_000;

/*
 * Filled accent (#5A55F2) glyphs exported from Figma "Reservation Container"
 * (person node 1:13787, calendar node 1:13790). Lucide's `User`/`Calendar` are
 * outline-only and do not match this filled product style, so the exact vector
 * paths are inlined here and colored via `currentColor` (CLAUDE.md §5).
 */
function ReservationPersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M7.59968 7.25156C7.59968 4.82151 9.56962 2.85156 11.9997 2.85156C14.4297 2.85156 16.3996 4.82151 16.3996 7.25156C16.3996 9.68162 14.4297 11.6516 11.9997 11.6516C9.56962 11.6516 7.59968 9.68162 7.59968 7.25156Z" />
      <path d="M11.9996 13.5977C9.68765 13.5977 7.53021 14.0502 5.91594 14.9198C4.30281 15.7887 3.09962 17.1639 3.09962 18.9977L3.09961 19.3253C3.09958 19.512 3.09955 19.702 3.11282 19.8645C3.12759 20.0452 3.16317 20.2695 3.27947 20.4977C3.43767 20.8082 3.6901 21.0606 4.00059 21.2188C4.22884 21.3351 4.45309 21.3706 4.63382 21.3854C4.79626 21.3986 4.98629 21.3986 5.17294 21.3986L18.8265 21.3978C19.0131 21.3978 19.2031 21.3978 19.3655 21.3845C19.5462 21.3697 19.7705 21.3342 19.9987 21.2179C20.3091 21.0597 20.5615 20.8072 20.7197 20.4968C20.836 20.2686 20.8716 20.0443 20.8863 19.8636C20.8996 19.7012 20.8996 19.5112 20.8995 19.3245L20.8995 18.9977C20.8995 17.1639 19.6963 15.7887 18.0832 14.9198C16.4689 14.0502 14.3115 13.5977 11.9996 13.5977Z" />
    </svg>
  );
}

function ReservationCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.40132 1.75156C9.40132 1.25451 8.99838 0.851562 8.50132 0.851562C8.00427 0.851562 7.60133 1.25451 7.60133 1.75156V2.85134H6.91615C6.38629 2.85133 5.93509 2.85132 5.56467 2.88158C5.17551 2.91338 4.79692 2.98301 4.43499 3.16743C3.88932 3.44546 3.44568 3.8891 3.16765 4.43477C2.98323 4.79671 2.9136 5.1753 2.8818 5.56446C2.85154 5.93487 2.85155 6.38603 2.85156 6.91586V17.0867C2.85155 17.6166 2.85154 18.0678 2.8818 18.4382C2.9136 18.8274 2.98323 19.206 3.16765 19.5679C3.44568 20.1136 3.88932 20.5572 4.43499 20.8353C4.79692 21.0197 5.17551 21.0893 5.56467 21.1211C5.93508 21.1514 6.38623 21.1514 6.91605 21.1513H17.0869C17.6167 21.1514 18.068 21.1514 18.4384 21.1211C18.8276 21.0893 19.2061 21.0197 19.5681 20.8353C20.1137 20.5572 20.5574 20.1136 20.8354 19.5679C21.0198 19.206 21.0895 18.8274 21.1213 18.4382C21.1515 18.0678 21.1515 17.6167 21.1515 17.0868V6.91594C21.1515 6.38611 21.1515 5.93487 21.1213 5.56446C21.0895 5.1753 21.0198 4.79671 20.8354 4.43477C20.5574 3.8891 20.1137 3.44546 19.5681 3.16743C19.2061 2.98301 18.8276 2.91338 18.4384 2.88158C18.068 2.85132 17.6168 2.85133 17.0869 2.85134H16.4013V1.75159C16.4013 1.25453 15.9984 0.851587 15.5013 0.851587C15.0042 0.851587 14.6013 1.25453 14.6013 1.75159V2.85134H9.40132V1.75156ZM14.6013 5.75159V4.65134H9.40132V5.75156C9.40132 6.24862 8.99838 6.65156 8.50132 6.65156C8.00427 6.65156 7.60133 6.24862 7.60133 5.75156V4.65134H6.55157C5.73701 4.65134 5.54318 4.66244 5.41166 4.70518C5.07678 4.81399 4.81423 5.07654 4.70542 5.41142C4.66268 5.54294 4.65158 5.73678 4.65158 6.55134V8.60132H19.3515V6.55134C19.3515 5.73678 19.3404 5.54294 19.2977 5.41142C19.1889 5.07654 18.9263 4.81399 18.5914 4.70518C18.4599 4.66244 18.2661 4.65134 17.4515 4.65134H16.4013V5.75159C16.4013 6.24864 15.9984 6.65159 15.5013 6.65159C15.0042 6.65159 14.6013 6.24864 14.6013 5.75159ZM19.3515 10.4013H4.65158V17.4513C4.65158 18.2659 4.66268 18.4597 4.70542 18.5913C4.81423 18.9261 5.07678 19.1887 5.41166 19.2975C5.54318 19.3402 5.73701 19.3513 6.55157 19.3513H17.4515C18.2661 19.3513 18.4599 19.3402 18.5914 19.2975C18.9263 19.1887 19.1889 18.9261 19.2977 18.5913C19.3404 18.4597 19.3515 18.2659 19.3515 17.4513V10.4013Z"
      />
      <rect width="16" height="6" transform="matrix(1 0 0 -1 4 10)" />
    </svg>
  );
}

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
    <div className="flex flex-col gap-5">
      <p
        aria-hidden={remainingLabel === null}
        className={[
          "m-0 text-sm",
          remainingLabel === null
            ? "text-transparent"
            : isOverdue
              ? "text-dashboard-tire-warning"
              : "text-dashboard-chart-accent",
        ].join(" ")}
      >
        {remainingLabel ?? " "}
      </p>
      <p className="m-0 flex items-center gap-2 text-base font-medium text-dashboard-account-text">
        <ReservationPersonIcon className="h-5 w-5 shrink-0 text-dashboard-chart-accent" />
        {rental.renterName}
      </p>
      <p className="m-0 flex items-center gap-2 text-base font-medium text-dashboard-account-text">
        <ReservationCalendarIcon className="h-5 w-5 shrink-0 text-dashboard-chart-accent" />
        {formatKstWireDateLabel(rental.startDate)} - {formatKstWireDateLabel(rental.endDate)}
      </p>
    </div>
  );
}
