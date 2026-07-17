"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchVehicleUsageHistory,
  VehicleUsageHistoryFetchError,
} from "@/lib/dashboard/vehicles/usage-history-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the "이용 이력" tab (issue #15, PM AC19/AC20). `useQuery`
 * keyed per page (not `useInfiniteQuery`) — AC19 requires a numeric
 * pagination contract (`?tab=usage&page=N`), not infinite scroll.
 */
export function useVehicleUsageHistory(vehicleId: string, page: number) {
  return useQuery({
    queryKey: vehiclesQueryKeys.usageHistory(vehicleId, page),
    queryFn: ({ signal }) => fetchVehicleUsageHistory(vehicleId, page, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof VehicleUsageHistoryFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
