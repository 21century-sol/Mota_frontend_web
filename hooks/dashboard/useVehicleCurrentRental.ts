"use client";

import { useQuery } from "@tanstack/react-query";

import {
  CurrentRentalFetchError,
  fetchCurrentRental,
} from "@/lib/dashboard/vehicles/current-rental-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the `/dashboard/vehicles/[vehicleId]` right-hand "예약 내역"
 * panel (issue #42). Same retry policy as its sibling hooks
 * (`useVehicleDetail`, `useVehicleTireDetail`): a `client-error` is not
 * retried (an idempotent retry cannot resolve it), network/server errors get
 * one retry.
 */
export function useVehicleCurrentRental(vehicleId: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.currentRental(vehicleId),
    queryFn: ({ signal }) => fetchCurrentRental(vehicleId, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof CurrentRentalFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
