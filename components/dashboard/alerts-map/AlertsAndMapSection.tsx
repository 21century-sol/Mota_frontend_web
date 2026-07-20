"use client";

import { VehicleMap } from "@/components/dashboard/alerts-map/VehicleMap";
import { LiveAlertsFeed } from "@/components/dashboard/alerts-map/LiveAlertsFeed";

/**
 * `/dashboard` 실시간 알림 + 차량 지도 섹션 (issue #12, Figma "Map and Alerts
 * Container" node 2377:23755).
 *
 * 알림은 SSE(`GET /api/dashboard/alerts/subscribe`)로 실시간 수신한다
 * (`LiveAlertsFeed`). 이전의 REST 1회성 fetch(`useAlerts`) + 목록/스켈레톤/에러
 * 재시도/선택 UI는 대응하는 백엔드 목록 GET 엔드포인트가 없어 항상 에러 상태였고,
 * 실시간 요구(앱 POST → 서버 push)와도 맞지 않아 SSE 피드로 대체했다.
 *
 * 지도(`VehicleMap`)는 좌표 기반 마커를 그리지만, SSE payload(`AlertResponse`)에는
 * 좌표가 없어 현재 마커 연동 대상이 아니다 — 빈 목록을 넘겨 지도는 fallback/빈
 * 상태로 둔다. 지도 마커 연동이 필요하면 백엔드 payload에 좌표 보강이 선행되어야
 * 한다.
 */
export function AlertsAndMapSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <VehicleMap alerts={[]} selectedAlertId={null} />
      <LiveAlertsFeed />
    </div>
  );
}
