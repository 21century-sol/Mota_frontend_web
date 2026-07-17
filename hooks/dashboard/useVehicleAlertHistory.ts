"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchVehicleAlertHistory,
  VehicleAlertHistoryFetchError,
} from "@/lib/dashboard/vehicles/alert-history-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the vehicle detail side panel's alert history (issue #15,
 * PM AC10/AC11). Independent of `useVehicleDetail`/`useAlerts` (#12's
 * dashboard-home alert widget) — a different endpoint and domain.
 */
export function useVehicleAlertHistory(vehicleId: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.alertHistory(vehicleId),
    queryFn: ({ signal }) => fetchVehicleAlertHistory(vehicleId, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof VehicleAlertHistoryFetchError && error.kind === "client-error") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
