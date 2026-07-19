"use client";

import type { ReservationStatus } from "@/types/dashboard/reservation";
import { ReservationListFetchError } from "@/lib/dashboard/reservations/api";
import { useReservations } from "@/hooks/dashboard/useReservations";
import { ReservationListPanel } from "@/components/dashboard/reservations/ReservationListPanel";

/**
 * Data-fetching boundary for `/dashboard/reservations` (issue #16, real API
 * wired in #51, `GET /api/dashboard/rentals`). Owns loading/error/success
 * branching via `useReservations`; the "표시할 예약이 없습니다." empty state
 * itself stays owned by `ReservationListPanel` (its `items.length === 0`
 * branch, unchanged) since an empty *successful* response is a distinct case
 * from "not loaded yet" or "failed to load".
 *
 * `ReservationListPanel`/`ReservationTable`/`ReservationStatusTabs`/
 * `ReservationPagination`/`ReservationStatusBadge` are unmodified — only
 * their input props switch from fixture-derived to API-derived data. The
 * loading/error messages below intentionally reuse the exact
 * `role="status"`/`role="alert"` + className patterns already established by
 * `ReservationListPanel`'s empty state and `VehicleListSection`'s error
 * state (`components/dashboard/vehicles/VehicleListSection.tsx`) rather than
 * introducing a new skeleton component, per PM Scope (CLAUDE.md §4 "재사용보다
 * 책임 분리를 우선"; no new visual language for a state that doesn't have its
 * own confirmed Figma design).
 */
export function ReservationsSection({
  status,
  page,
  rentedOn,
  returnedOn,
}: {
  status: ReservationStatus | undefined;
  page: number;
  rentedOn?: string;
  returnedOn?: string;
}) {
  const query = useReservations({ status, rentedOn, returnedOn }, page);

  if (query.isPending) {
    return (
      <section aria-labelledby="reservations-heading" className="flex flex-col gap-7">
        <h1
          id="reservations-heading"
          className="text-2xl font-medium tracking-[-0.6px] text-dashboard-vehicles-title"
        >
          대여 현황
        </h1>
        <p
          role="status"
          aria-busy="true"
          className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label"
        >
          대여 현황을 불러오는 중입니다.
        </p>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section aria-labelledby="reservations-heading" className="flex flex-col gap-7">
        <h1
          id="reservations-heading"
          className="text-2xl font-medium tracking-[-0.6px] text-dashboard-vehicles-title"
        >
          대여 현황
        </h1>
        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
            {query.error instanceof ReservationListFetchError
              ? query.error.userMessage
              : "대여 현황을 불러오지 못했습니다."}
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
      </section>
    );
  }

  return (
    <ReservationListPanel
      status={status}
      items={query.data.items}
      pageInfo={query.data.pageInfo}
      rentedOn={rentedOn}
      returnedOn={returnedOn}
    />
  );
}
