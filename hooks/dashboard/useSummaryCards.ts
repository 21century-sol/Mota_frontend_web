"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchVehicleSummaryCounts,
  VehicleSummaryFetchError,
} from "@/lib/dashboard/summary/api";
import { summaryQueryKeys } from "@/lib/dashboard/summary/queryKeys";

/**
 * Domain hook for the `/dashboard` summary cards.
 *
 * No auto-polling (PM Assumption A3, `.claude/handoffs/11-pm-breakdown.md`): the
 * issue and Figma design have no real-time refresh requirement, so this fetches
 * once on mount and otherwise relies on the retry button (`refetch`).
 */
export function useSummaryCards() {
  return useQuery({
    queryKey: summaryQueryKeys.vehicleStatusCounts(),
    queryFn: ({ signal }) => fetchVehicleSummaryCounts(signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (
        error instanceof VehicleSummaryFetchError &&
        error.kind === "client-error"
      ) {
        return false; // 4xx will not be resolved by an idempotent retry.
      }
      return failureCount < 1; // Only auto-retry network/server errors, once.
    },
  });
}
