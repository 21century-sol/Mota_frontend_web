"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchVehicleRentalHistory,
  VehicleRentalHistoryFetchError,
} from "@/lib/dashboard/vehicles/usage-history-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the "이용 이력" tab (issue #49, confirmed
 * `GET /api/dashboard/vehicles/{vehicleId}/rentals` contract). `useQuery`
 * keyed per page (not `useInfiniteQuery`) — the URL contract requires a
 * numeric pagination scheme (`?tab=usage&page=N`), not infinite scroll.
 * `page` is 1-based throughout (query key, URL); the 0-based conversion for
 * the actual request happens inside `fetchVehicleRentalHistory`'s URL
 * builder only (PM A1).
 */
export function useVehicleUsageHistory(vehicleId: string, page: number) {
  return useQuery({
    queryKey: vehiclesQueryKeys.usageHistory(vehicleId, page),
    queryFn: ({ signal }) => fetchVehicleRentalHistory(vehicleId, page, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof VehicleRentalHistoryFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
