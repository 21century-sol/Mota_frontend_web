"use client";

import { useMemo } from "react";

import { useAlertStream } from "@/hooks/dashboard/useAlertStream";
import { useAlertHistory } from "@/hooks/dashboard/useAlertHistory";
import type { LiveAlert } from "@/lib/dashboard/alerts/stream";

/**
 * 대시보드 실시간 알림(SSE) + 서버 히스토리를 병합한다.
 * 지도 범위는 live-locations API 전체가 소유하며(issue #69), 알림의 vehicleId는
 * 행 클릭 시 지도 차량 선택에만 사용한다.
 */
export function useDashboardAlerts() {
  const liveAlerts = useAlertStream();
  const history = useAlertHistory();

  const liveIds = useMemo(
    () => new Set(liveAlerts.map((alert) => alert.id)),
    [liveAlerts],
  );

  const alerts = useMemo(() => {
    const seen = new Set<string>();
    const merged: LiveAlert[] = [];
    for (const alert of [...liveAlerts, ...history.items]) {
      if (seen.has(alert.id)) continue;
      seen.add(alert.id);
      merged.push(alert);
    }
    merged.sort((a, b) =>
      a.occurredAtIso < b.occurredAtIso
        ? 1
        : a.occurredAtIso > b.occurredAtIso
          ? -1
          : 0,
    );
    return merged;
  }, [liveAlerts, history.items]);

  return {
    alerts,
    liveIds,
    fetchNextPage: history.fetchNextPage,
    hasNextPage: history.hasNextPage,
    isFetchingNextPage: history.isFetchingNextPage,
    isLoading: history.isLoading,
    isError: history.isError,
    refetch: history.refetch,
    isFetching: history.isFetching,
  };
}
