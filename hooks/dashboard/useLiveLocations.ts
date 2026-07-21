"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchLiveLocations,
  liveLocationsQueryKey,
} from "@/lib/dashboard/live-locations/api";
import type { LiveLocation } from "@/types/dashboard/live-locations";

/** 대시보드 지도 GPS 폴링 간격 (issue #64, 타이어 상세와 동일 2초). */
export const LIVE_LOCATIONS_POLL_INTERVAL_MS = 2_000;

/**
 * `GET /api/dashboard/live-locations`를 2초마다 조회해 API가 반환한 대여 중
 * 전체 차량을 지도에 제공한다(issue #69). 알림은 지도 범위를 제한하지 않고,
 * 행 클릭 시 차량 선택/재중앙에만 사용한다.
 */
export function useLiveLocations(): {
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

  return {
    locations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
  };
}
