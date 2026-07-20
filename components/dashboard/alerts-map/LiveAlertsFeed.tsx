"use client";

import { useCallback, useEffect, useRef } from "react";
import { AlertTriangle, BellRing } from "lucide-react";

import type { LiveAlert, LiveAlertSeverity } from "@/lib/dashboard/alerts/stream";

const SEVERITY_STYLES: Record<
  LiveAlertSeverity,
  { bg: string; icon: string; label: string }
> = {
  DANGER: { bg: "bg-dashboard-alert-danger-bg", icon: "text-[#fe3d16]", label: "위험" },
  WARNING: { bg: "bg-dashboard-alert-warning-bg", icon: "text-[#ff8a00]", label: "주의" },
};

export type LiveAlertsFeedProps = {
  alerts: LiveAlert[];
  liveIds: ReadonlySet<string>;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
};

/**
 * SSE/히스토리 알림 목록 UI. 데이터는 `useDashboardAlerts`가 소유하고 이 컴포넌트는
 * props만 렌더한다. 행 클릭은 `vehicleId`를 올려 지도 pan/강조에 연결한다(#64).
 */
export function LiveAlertsFeed({
  alerts,
  liveIds,
  selectedVehicleId,
  onSelectVehicle,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  isFetching,
  refetch,
}: LiveAlertsFeedProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const maybeLoadMore = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 80) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

      <div
        ref={scrollRef}
        onScroll={maybeLoadMore}
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
              const isSelected = alert.vehicleId === selectedVehicleId;
              const newSuffix = isNew ? ", 새 알림" : "";
              const selectedSuffix = isSelected ? ", 지도에서 선택됨" : "";

              return (
                <li key={alert.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${palette.label} 알림, ${alert.vehiclePlateNumber}, ${alert.title}, ${alert.occurredAtLabel}${newSuffix}${selectedSuffix}`}
                    onClick={() => onSelectVehicle(alert.vehicleId)}
                    className={[
                      "flex w-full items-center gap-3 px-6 py-3 text-left outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-dashboard-chart-accent focus-visible:ring-offset-2",
                      isSelected
                        ? "bg-dashboard-surface"
                        : "hover:bg-dashboard-surface/60",
                    ].join(" ")}
                  >
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
                        <span className="sr-only">{palette.label} 알림, </span>
                        {alert.vehiclePlateNumber}
                      </span>
                      <span className="block truncate text-xs text-[#737a87]">
                        {alert.title}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-dashboard-text-tertiary">
                      {alert.occurredAtLabel}
                      {isNew ? (
                        // eslint-disable-next-line @next/next/no-img-element -- static SVG from /public
                        <img
                          src="/assets/dashboard/alert-new-dot.svg"
                          alt=""
                          width={6}
                          height={6}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}

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
