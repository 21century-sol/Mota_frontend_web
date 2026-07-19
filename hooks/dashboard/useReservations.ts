"use client";

import { useQuery } from "@tanstack/react-query";

import type { ReservationListFilters } from "@/types/dashboard/reservation";
import {
  fetchReservations,
  ReservationListFetchError,
} from "@/lib/dashboard/reservations/api";
import { reservationsQueryKeys } from "@/lib/dashboard/reservations/queryKeys";

/**
 * Domain hook for `/dashboard/reservations` "대여 현황" (issue #51, confirmed
 * `GET /api/dashboard/rentals` contract, replacing the local-fixture-only
 * implementation from issue #16). `useQuery` keyed per page (not
 * `useInfiniteQuery`) — the URL contract is numeric pagination (`?page=N`),
 * not infinite scroll, same as `useVehicleUsageHistory` (issue #49). `page`
 * is 1-based throughout (query key, URL); the 0-based conversion for the
 * actual request happens inside `fetchReservations`'s URL builder only (PM
 * Decision 5).
 */
export function useReservations(filters: ReservationListFilters, page: number) {
  return useQuery({
    queryKey: reservationsQueryKeys.list({
      status: filters.status,
      page,
      rentedOn: filters.rentedOn,
      returnedOn: filters.returnedOn,
    }),
    queryFn: ({ signal }) => fetchReservations(filters, page, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof ReservationListFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
