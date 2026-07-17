"use client";

import { useQuery } from "@tanstack/react-query";

import type { TireTrendMetric } from "@/types/dashboard/vehicle";
import { fetchVehicleTireTrend, VehicleTireTrendFetchError } from "@/lib/dashboard/vehicles/tire-trend-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the tire status-trend chart (issue #15, PM AC18). `metric`
 * (the active toggle) is part of the query key, so switching it triggers a
 * fresh fetch instead of client-side filtering a combined dataset.
 */
export function useVehicleTireTrend(vehicleId: string, metric: TireTrendMetric) {
  return useQuery({
    queryKey: vehiclesQueryKeys.tireTrend(vehicleId, metric),
    queryFn: ({ signal }) => fetchVehicleTireTrend(vehicleId, metric, signal),
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
