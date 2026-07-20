"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchLiveLocations,
  filterLocationsByVehicleIds,
  liveLocationsQueryKey,
} from "@/lib/dashboard/live-locations/api";
import type { LiveLocation } from "@/types/dashboard/live-locations";

/** 대시보드 지도 GPS 폴링 간격 (issue #64, 타이어 상세와 동일 2초). */
export const LIVE_LOCATIONS_POLL_INTERVAL_MS = 2_000;

/**
 * `GET /api/dashboard/live-locations`를 2초마다 조회한 뒤, 알림 리스트의
 * `vehicleIds`로 클라이언트 필터한다(API query 없음 — Decision #64).
 */
export function useLiveLocations(vehicleIds: readonly string[]): {
  locations: LiveLocation[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
} {
  const query = useQuery({
    queryKey: liveLocationsQueryKey,
    queryFn: ({ signal }) => fetchLiveLocations(signal),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchInterval: LIVE_LOCATIONS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  });

  const idKey = vehicleIds.slice().sort().join("|");
  const locations = useMemo(() => {
    const all = query.data ?? [];
    return filterLocationsByVehicleIds(all, vehicleIds);
    // idKey stabilizes when contents equal but array identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- vehicleIds via idKey
  }, [query.data, idKey]);

  return {
    locations,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
  };
}
