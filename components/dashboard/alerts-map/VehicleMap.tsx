"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, MapPinOff } from "lucide-react";

import type { AlertItem } from "@/types/dashboard/alerts";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";
import {
  loadKakaoMaps,
  type KakaoMap,
  type KakaoMarker,
} from "@/lib/dashboard/map/kakao-loader";

type MapStatus = "unavailable" | "loading" | "ready" | "error";

// No alert-independent default center is specified by Figma/PM — used only
// until the SDK loads or before any alert is selected (Seoul City Hall).
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM_LEVEL = 10;

// Plain colored-circle markers encoded as inline SVG data URIs — no external
// asset file needed (Non-goal: clustering/custom marker art, issue #12).
// Selected marker uses the existing `dashboard-chart-accent` color (#5a55f2)
// and a larger size so the emphasis (Decision Resolved 2026-07-16 #3,
// `.claude/handoffs/12-figma-specs.md`) does not rely on color alone.
const NORMAL_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="#0f0f10" stroke="#ffffff" stroke-width="2"/></svg>',
)}`;
const SELECTED_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="11" fill="#5a55f2" stroke="#ffffff" stroke-width="3"/></svg>',
)}`;

/**
 * Real-time vehicle map (issue #12). Loads the Kakao Maps SDK when
 * `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` is set and renders a fully supported fallback
 * message otherwise (missing key or SDK load failure) — Decision Resolved
 * 2026-07-16 #1/#2, `.claude/handoffs/12-pm-breakdown.md`. This is not a
 * temporary placeholder: both branches are "done" states for this issue.
 */
export function VehicleMap({
  alerts,
  selectedAlertId,
}: {
  alerts: AlertItem[];
  selectedAlertId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<Map<string, KakaoMarker>>(new Map());
  const [status, setStatus] = useState<MapStatus>(
    dashboardClientEnv.kakaoMapAppKey ? "loading" : "unavailable",
  );

  // Load the SDK and create the map instance once.
  useEffect(() => {
    const appKey = dashboardClientEnv.kakaoMapAppKey;
    if (!appKey || !containerRef.current) return;

    let cancelled = false;

    loadKakaoMaps(appKey)
      .then((kakaoMaps) => {
        if (cancelled || !containerRef.current) return;
        const center = new kakaoMaps.LatLng(
          DEFAULT_CENTER.lat,
          DEFAULT_CENTER.lng,
        );
        mapRef.current = new kakaoMaps.Map(containerRef.current, {
          center,
          level: DEFAULT_ZOOM_LEVEL,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // Intentionally runs once: the app key does not change at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync one marker per alert, and re-center on the selected alert's location.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const kakaoMaps = window.kakao?.maps;
    if (!kakaoMaps) return;

    const map = mapRef.current;
    const currentIds = new Set(alerts.map((alert) => alert.id));

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    for (const alert of alerts) {
      const isSelected = alert.id === selectedAlertId;
      const position = new kakaoMaps.LatLng(
        alert.location.lat,
        alert.location.lng,
      );
      const image = new kakaoMaps.MarkerImage(
        isSelected ? SELECTED_MARKER_SVG : NORMAL_MARKER_SVG,
        new kakaoMaps.Size(isSelected ? 30 : 20, isSelected ? 30 : 20),
      );

      const existingMarker = markersRef.current.get(alert.id);
      if (existingMarker) {
        existingMarker.setPosition(position);
        existingMarker.setImage(image);
      } else {
        const marker = new kakaoMaps.Marker({ position, map, image });
        markersRef.current.set(alert.id, marker);
      }
    }

    const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId);
    if (selectedAlert) {
      map.panTo(
        new kakaoMaps.LatLng(
          selectedAlert.location.lat,
          selectedAlert.location.lng,
        ),
      );
    }
  }, [alerts, selectedAlertId, status]);

  // Remove all markers on unmount so a re-mounted map (e.g. Fast Refresh) does
  // not accumulate stale marker instances against a script-level cached SDK.
  // `markers` is the same `Map` instance `markersRef.current` always points to
  // (only mutated in place by the sync effect above, never reassigned), so
  // capturing it here keeps the cleanup working with the up-to-date contents
  // while satisfying the exhaustive-deps ref-in-cleanup check.
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const marker of markers.values()) {
        marker.setMap(null);
      }
      markers.clear();
    };
  }, []);

  const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId);
  // Worded so it stays accurate regardless of map readiness (AC7 requires the
  // announcement even in the fallback state, since AC6 keeps the list fully
  // independent of the map — this must never claim a pan happened when it did not).
  const liveMessage = !selectedAlert
    ? ""
    : status === "ready"
      ? `지도 중심이 ${selectedAlert.vehiclePlateNumber} 위치로 이동했습니다.`
      : `${selectedAlert.vehiclePlateNumber} 선택됨 — 지도를 사용할 수 없어 위치를 표시할 수 없습니다.`;

  return (
    <section
      aria-labelledby="dashboard-map-heading"
      className="rounded-dashboard-card bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="dashboard-map-heading"
          className="m-0 text-lg font-normal tracking-[-0.45px] text-black"
        >
          실시간 차량 위치
        </h2>

        {/*
          "전체"는 정적 텍스트만 렌더링한다 — Figma에 상세 화면 디자인이 없어 클릭
          인터랙션·href·목적지를 만들지 않는다(`#13` 관례와 동일, PM handoff
          Non-goals).
        */}
        <span className="flex items-center gap-0.5 text-[13px] font-medium tracking-[-0.325px] text-dashboard-text-tertiary">
          전체
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-4 min-h-[320px] overflow-hidden rounded-lg">
        {status === "unavailable" || status === "error" ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border bg-dashboard-surface px-4 text-center">
            <MapPinOff aria-hidden="true" className="h-8 w-8 text-dashboard-text-tertiary" />
            <p className="m-0 text-sm font-medium text-dashboard-text-primary">
              지도를 불러올 수 없습니다
            </p>
            <p className="m-0 max-w-xs text-xs text-dashboard-text-muted">
              차량 위치는 왼쪽 알림 목록에서 확인해주세요.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="h-full min-h-[320px] w-full" />
        )}
      </div>

      {/* AC7: selecting an alert moves the map, and this live region announces
          that outcome for screen reader users independently of the visual pan. */}
      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
    </section>
  );
}
