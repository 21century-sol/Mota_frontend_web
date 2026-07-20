"use client";

import { useEffect, useState } from "react";

import { dashboardClientEnv } from "@/lib/dashboard/env/client";
import {
  ALERTS_SUBSCRIBE_PATH,
  MAX_LIVE_ALERTS,
  parseAlertEvent,
  type LiveAlert,
} from "@/lib/dashboard/alerts/stream";

/**
 * 대시보드 실시간 알림 SSE 구독 훅.
 *
 * `GET /api/dashboard/alerts/subscribe`에 `EventSource`로 연결해 서버가 push하는
 * `alert` 이벤트만 수신한다. 여기서 반환하는 것은 "이번 세션에 실시간으로 도착한
 * 신규 알림"이며(최신순, id 중복 제거, 최대 `MAX_LIVE_ALERTS`), 과거 목록은
 * `useAlertHistory`(서버 페이지 조회)가 담당한다.
 *
 * 새로고침 후 지속성은 localStorage가 아니라 서버 목록 재조회로 얻으므로, 이 훅은
 * 저장하지 않는다. 연결 상태 표시는 디자인에서 제외되어 추적하지 않는다.
 */
export function useAlertStream(): LiveAlert[] {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);

  useEffect(() => {
    // SSR/비지원 환경 방어: EventSource는 브라우저 전용이다.
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const url = `${dashboardClientEnv.apiBase}${ALERTS_SUBSCRIBE_PATH}`;
    const es = new EventSource(url);

    const handleAlert = (event: Event) => {
      const item = parseAlertEvent((event as MessageEvent).data);
      if (!item) return;
      // 신규 알림을 항상 맨 위로. 같은 id 재전송은 중복 제거.
      setAlerts((prev) => {
        const rest = prev.filter((alert) => alert.id !== item.id);
        return [item, ...rest].slice(0, MAX_LIVE_ALERTS);
      });
    };

    es.addEventListener("alert", handleAlert);

    return () => {
      es.removeEventListener("alert", handleAlert);
      es.close();
    };
  }, []);

  return alerts;
}
