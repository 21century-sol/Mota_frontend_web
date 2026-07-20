"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchVehicleTireTrend, VehicleTireTrendFetchError } from "@/lib/dashboard/vehicles/tire-trend-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the tire status-trend chart. Fetches all four metric series
 * once per vehicle; the metric toggle in `TireStatusTab` filters client-side.
 */
export function useVehicleTireTrend(vehicleId: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.tireTrend(vehicleId),
    queryFn: ({ signal }) => fetchVehicleTireTrend(vehicleId, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof VehicleTireTrendFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
