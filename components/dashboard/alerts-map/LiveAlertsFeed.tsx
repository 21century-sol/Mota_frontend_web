"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, BellRing } from "lucide-react";

import { useAlertStream } from "@/hooks/dashboard/useAlertStream";
import { useAlertHistory } from "@/hooks/dashboard/useAlertHistory";
import type { LiveAlert, LiveAlertSeverity } from "@/lib/dashboard/alerts/stream";

const SEVERITY_STYLES: Record<
  LiveAlertSeverity,
  { bg: string; icon: string; label: string }
> = {
  DANGER: { bg: "bg-dashboard-alert-danger-bg", icon: "text-[#fe3d16]", label: "위험" },
  WARNING: { bg: "bg-dashboard-alert-warning-bg", icon: "text-[#ff8a00]", label: "주의" },
};

/**
 * SSE 실시간 알림 피드.
 *
 * - 과거 목록: `useAlertHistory`(서버 조회) — 처음엔 상위 5건만 보이고, 아래로
 *   스크롤하면 다음 5건씩 이어 붙인다(무한 스크롤). 새로고침 후에도 유지된다.
 * - 실시간 신규: `useAlertStream`(SSE) — 이번 세션에 도착한 알림. 최신순 맨 위에
 *   얹히고, 시간 옆에 "새 알림" 빨간 점(Figma export SVG)을 표시한다.
 *
 * 연결 상태 표시는 디자인에서 제외됐다. 알림 클릭 시 지도 이동은 이번 범위 밖이라
 * 아이템은 비상호작용(li)으로 둔다. 카드 좌우 패딩을 items/헤더로 옮겨 구분선이
 * 카드 끝에서 끝까지 이어지게 한다.
 */
export function LiveAlertsFeed() {
  const liveAlerts = useAlertStream();
  const {
    items: historyItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAlertHistory();

  // 이번 세션에 실시간으로 도착한 알림 id = "새 알림"(빨간 점 대상).
  const liveIds = useMemo(
    () => new Set(liveAlerts.map((alert) => alert.id)),
    [liveAlerts],
  );

  // 실시간(위) + 과거(아래)를 합치고 id 중복 제거 후 시각 내림차순 정렬.
  const alerts = useMemo(() => {
    const seen = new Set<string>();
    const merged: LiveAlert[] = [];
    for (const alert of [...liveAlerts, ...historyItems]) {
      if (seen.has(alert.id)) continue;
      seen.add(alert.id);
      merged.push(alert);
    }
    merged.sort((a, b) =>
      a.occurredAtIso < b.occurredAtIso ? 1 : a.occurredAtIso > b.occurredAtIso ? -1 : 0,
    );
    return merged;
  }, [liveAlerts, historyItems]);

  // 무한 스크롤: 리스트는 카드 안에서 자체 스크롤된다. 스크롤이 바닥 근처에 오면
  // 다음 페이지를 당겨온다. (커스텀 root의 IntersectionObserver는 일부 환경에서
  // 스크롤 변화를 놓쳐, 신뢰도 높은 onScroll 방식을 쓴다.)
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const maybeLoadMore = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 80) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 초기 로드가 컨테이너를 못 채우면(스크롤 불가) 스크롤로 더 못 부르니, 스크롤이
  // 가능해질 때까지 자동으로 다음 페이지를 채운다.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.clientHeight > 0 && el.scrollHeight <= el.clientHeight) {
      fetchNextPage();
    }
  }, [alerts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isInitialLoading = isLoading && alerts.length === 0;
  const showError = isError && alerts.length === 0;
  const showEmpty = !isInitialLoading && !showError && alerts.length === 0;

  return (
    <section
      aria-labelledby="live-alerts-heading"
      className="flex flex-col rounded-dashboard-card bg-white py-6"
    >
      <h2
        id="live-alerts-heading"
        className="m-0 px-6 text-lg font-normal tracking-[-0.45px] text-black"
      >
        실시간 알림
      </h2>

      {/* 새 알림이 도착하면 스크린리더가 읽도록 polite live region으로 감싼다.
          고정 높이(지도 영역과 동일한 320px)로 카드 안에서 내부 스크롤되게 하고,
          좌우 패딩이 없어 구분선이 카드 끝에서 끝까지 이어진다(패딩은 항목에 둔다). */}
      <div
        ref={scrollRef}
        onScroll={maybeLoadMore}
        // 커스텀 스크롤바(Figma "scrollbar" 23:2115): 4px 너비, #99a1ab, pill, 투명 트랙.
        // 표준 scrollbar-width/color는 Chromium에서 ::-webkit-scrollbar의 4px를 덮어써
        // 두지 않는다(정확한 4px 유지). WebKit/Blink 대상.
        className="mt-4 h-[320px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#99a1ab] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
        aria-live="polite"
        aria-busy={isFetching}
      >
        {isInitialLoading ? (
          <p className="m-0 flex h-full items-center justify-center px-6 py-10 text-center text-sm text-dashboard-text-muted">
            실시간 알림을 불러오는 중입니다.
          </p>
        ) : showError ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center"
          >
            <p className="m-0 text-sm font-medium text-dashboard-text-primary">
              알림 목록을 불러오지 못했습니다.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2"
            >
              다시 시도
            </button>
          </div>
        ) : showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-dashboard-surface"
            >
              <BellRing className="h-6 w-6 text-dashboard-text-tertiary" />
            </span>
            <p className="m-0 text-sm font-medium text-dashboard-text-primary">
              아직 수신된 실시간 알림이 없습니다.
            </p>
            <p className="m-0 max-w-xs text-xs text-dashboard-text-muted">
              새 알림이 도착하면 이 영역에 실시간으로 표시됩니다.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-dashboard-divider">
            {alerts.map((alert) => {
              const palette = SEVERITY_STYLES[alert.severity];
              const isNew = liveIds.has(alert.id);

              return (
                <li key={alert.id} className="flex items-center gap-3 px-6 py-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${palette.bg}`}
                  >
                    <AlertTriangle
                      aria-hidden="true"
                      className={`h-4 w-4 ${palette.icon}`}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-black">
                      {/* 심각도는 색뿐 아니라 텍스트로도 전달(색 의존 금지). */}
                      <span className="sr-only">{palette.label} 알림, </span>
                      {alert.vehiclePlateNumber}
                    </span>
                    <span className="block truncate text-xs text-[#737a87]">
                      {alert.title}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-dashboard-text-tertiary">
                    {alert.occurredAtLabel}
                    {isNew && (
                      // 새 알림 표시: Figma에서 export한 6×6 점 SVG(public/assets/dashboard).
                      <img
                        src="/assets/dashboard/alert-new-dot.svg"
                        alt="새 알림"
                        width={6}
                        height={6}
                        className="shrink-0"
                      />
                    )}
                  </span>
                </li>
              );
            })}

            {/* 다음 페이지 로딩 표시. */}
            {isFetchingNextPage && (
              <li className="px-6 py-3 text-center text-[11px] text-dashboard-text-muted">
                더 불러오는 중…
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
