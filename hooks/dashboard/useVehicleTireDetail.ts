"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchVehicleTireDetails,
  VehicleTireDetailFetchError,
} from "@/lib/dashboard/vehicles/tire-detail-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/** Domain hook for the "타이어" tab's 4 wheel cards + banner (issue #15, PM AC15-AC17). */
export function useVehicleTireDetail(vehicleId: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.tireDetail(vehicleId),
    queryFn: ({ signal }) => fetchVehicleTireDetails(vehicleId, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof VehicleTireDetailFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
