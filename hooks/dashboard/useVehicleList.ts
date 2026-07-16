"use client";

import { useQuery } from "@tanstack/react-query";

import type { VehicleListFilters } from "@/types/dashboard/vehicle";
import { fetchVehicles, VehicleListFetchError } from "@/lib/dashboard/vehicles/api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the `/dashboard/vehicles` list (issue #14).
 *
 * `useQuery` only — the endpoint has no pagination parameters, so the entire
 * result set loads in one request (PM Decision 3,
 * `.claude/handoffs/14-pm-breakdown.md`); `useInfiniteQuery`/`keepPreviousData`
 * are intentionally not used. `filters` changing (status/tireStatus) produces
 * a new query key, so React Query treats it as a fresh fetch on its own.
 */
export function useVehicleList(filters: VehicleListFilters) {
  return useQuery({
    queryKey: vehiclesQueryKeys.list(filters),
    queryFn: ({ signal }) => fetchVehicles(filters, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (
        error instanceof VehicleListFetchError &&
        error.kind === "client-error"
      ) {
        return false; // 4xx will not be resolved by an idempotent retry.
      }
      return failureCount < 1; // Only auto-retry network/server errors, once.
    },
  });
}
