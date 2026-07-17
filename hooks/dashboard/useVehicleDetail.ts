"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchVehicleDetail, VehicleDetailFetchError } from "@/lib/dashboard/vehicles/detail-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the `/dashboard/vehicles/[vehicleId]` main payload (issue
 * #15, PM AC4-AC9). `not-found`/`client-error` are not retried (an idempotent
 * retry cannot resolve either); only network/server errors get one retry —
 * same policy as `useVehicleList` (issue #14).
 */
export function useVehicleDetail(vehicleId: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.detail(vehicleId),
    queryFn: ({ signal }) => fetchVehicleDetail(vehicleId, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (
        error instanceof VehicleDetailFetchError &&
        (error.kind === "client-error" || error.kind === "not-found")
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
