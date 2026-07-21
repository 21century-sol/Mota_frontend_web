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
 * - GPS: `GET /api/dashboard/live-locations`의 대여 중 전체 차량을 2초 폴링
 * - 클릭: vehicleId 선택 → 지도 panTo + 핀 강조. 같은 차량을 다시 클릭해도
 *   `focusNonce`로 재중앙(Decision A — GPS 폴링마다 추적하지 않음).
 */
export function AlertsAndMapSection() {
  const {
    alerts,
    liveIds,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useDashboardAlerts();

  const { locations } = useLiveLocations();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  /** Increments on every alert-row click so re-selecting the same vehicle re-pans. */
  const [focusNonce, setFocusNonce] = useState(0);

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setFocusNonce((nonce) => nonce + 1);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <VehicleMap
        locations={locations}
        selectedVehicleId={selectedVehicleId}
        focusNonce={focusNonce}
      />
      <LiveAlertsFeed
        alerts={alerts}
        liveIds={liveIds}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={handleSelectVehicle}
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
