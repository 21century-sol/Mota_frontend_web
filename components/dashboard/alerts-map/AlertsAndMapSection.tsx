"use client";

import { useState } from "react";

import { VehicleMap } from "@/components/dashboard/alerts-map/VehicleMap";
import { LiveAlertsFeed } from "@/components/dashboard/alerts-map/LiveAlertsFeed";
import { useDashboardAlerts } from "@/hooks/dashboard/useDashboardAlerts";
import { useLiveLocations } from "@/hooks/dashboard/useLiveLocations";

/**
 * `/dashboard` 실시간 알림 + 차량 지도 섹션 (issue #12 / #64).
 *
 * - 알림: SSE + 서버 히스토리 (`useDashboardAlerts`)
 * - GPS: `GET /api/dashboard/live-locations` 2초 폴링 후 알림 vehicleId로 필터
 * - 클릭: vehicleId 선택 → 지도 panTo + 핀 강조
 */
export function AlertsAndMapSection() {
  const {
    alerts,
    liveIds,
    vehicleIds,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useDashboardAlerts();

  const { locations } = useLiveLocations(vehicleIds);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <VehicleMap
        locations={locations}
        selectedVehicleId={selectedVehicleId}
      />
      <LiveAlertsFeed
        alerts={alerts}
        liveIds={liveIds}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        fetchNextPage={fetchNextPage}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
    </div>
  );
}
