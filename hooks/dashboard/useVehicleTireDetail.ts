"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchVehicleTireDetails,
  VehicleTireDetailFetchError,
} from "@/lib/dashboard/vehicles/tire-detail-api";
import { vehiclesQueryKeys } from "@/lib/dashboard/vehicles/queryKeys";

/**
 * Domain hook for the "타이어" tab's 4 wheel cards + 차량 이미지 펄스 (issue #15,
 * PM AC15-AC17). 실시간 타이어 모니터링 화면이라 2초 간격으로 폴링해 최신 센서/상태를
 * 반영한다(`refetchInterval`). 탭이 백그라운드일 때는 폴링을 멈춰(`...InBackground` 기본 false)
 * 불필요한 요청을 줄인다.
 */
const TIRE_DETAIL_POLL_INTERVAL_MS = 2_000;

export function useVehicleTireDetail(vehicleId: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.tireDetail(vehicleId),
    queryFn: ({ signal }) => fetchVehicleTireDetails(vehicleId, signal),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchInterval: TIRE_DETAIL_POLL_INTERVAL_MS,
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
