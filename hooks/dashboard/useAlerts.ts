"use client";

import { useQuery } from "@tanstack/react-query";

import { AlertsFetchError, fetchAlerts } from "@/lib/dashboard/alerts/api";
import { alertsQueryKeys } from "@/lib/dashboard/alerts/queryKeys";

/**
 * Domain hook for the `/dashboard` real-time alerts list.
 *
 * No auto-polling (PM Assumption A2, `.claude/handoffs/12-pm-breakdown.md`): the
 * issue explicitly allows "not truly real-time (polling optional)", so this
 * fetches once on mount and otherwise relies on the retry button (`refetch`).
 */
export function useAlerts() {
  return useQuery({
    queryKey: alertsQueryKeys.list(),
    queryFn: ({ signal }) => fetchAlerts(signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof AlertsFetchError && error.kind === "client-error") {
        return false; // 4xx will not be resolved by an idempotent retry.
      }
      return failureCount < 1; // Only auto-retry network/server errors, once.
    },
  });
}
