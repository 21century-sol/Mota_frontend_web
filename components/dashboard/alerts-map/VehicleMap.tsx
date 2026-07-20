"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, MapPinOff } from "lucide-react";

import type { LiveLocation } from "@/types/dashboard/live-locations";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";
import {
  loadKakaoMaps,
  type KakaoMap,
  type KakaoMarker,
} from "@/lib/dashboard/map/kakao-loader";

type MapStatus = "unavailable" | "loading" | "ready" | "error";

// No location-independent default center is specified by Figma — used until the
// SDK loads or when there are no pins (Jeju approx., matching product map demos).
const DEFAULT_CENTER = { lat: 33.4996, lng: 126.5312 };
const DEFAULT_ZOOM_LEVEL = 9;

// Figma 1:12020 / 첨부 에셋: 파란 원형 핀. 선택 시 크기만 키워 강조(색만 의존 금지).
const MARKER_BLUE = "#5a55f2";
const NORMAL_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="${MARKER_BLUE}"/></svg>`,
)}`;
const SELECTED_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="11" fill="${MARKER_BLUE}" stroke="#ffffff" stroke-width="3"/></svg>`,
)}`;

function vehicleIdsKey(locations: LiveLocation[]): string {
  return locations
    .map((location) => location.vehicleId)
    .slice()
    .sort()
    .join("|");
}

/**
 * Real-time vehicle map (issue #12 + #64). Loads Kakao Maps when
 * `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` is set; otherwise shows the supported fallback.
 *
 * Markers come from `getLiveLocations` filtered by alert `vehicleId`s. Selection
 * is by `vehicleId` (not alert id): panTo + larger blue pin.
 */
export function VehicleMap({
  locations,
  selectedVehicleId,
}: {
  locations: LiveLocation[];
  selectedVehicleId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<Map<string, KakaoMarker>>(new Map());
  const fittedIdsKeyRef = useRef<string>("");
  const lastPannedVehicleIdRef = useRef<string | null>(null);
  // Always start as `loading` so SSR HTML matches the client's first paint.
  // Reading `kakaoMapAppKey` in useState can disagree across realms and cause
  // hydration mismatch (fallback vs empty map container).
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const appKey = dashboardClientEnv.kakaoMapAppKey;
    if (!appKey || !containerRef.current) {
      setStatus("unavailable");
      return;
    }

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
  }, []);

  // Sync markers by vehicleId; fit bounds when the vehicle set changes; pan on select.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const kakaoMaps = window.kakao?.maps;
    if (!kakaoMaps) return;

    const map = mapRef.current;
    const currentIds = new Set(locations.map((location) => location.vehicleId));

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    for (const location of locations) {
      const isSelected = location.vehicleId === selectedVehicleId;
      const position = new kakaoMaps.LatLng(location.lat, location.lng);
      const image = new kakaoMaps.MarkerImage(
        isSelected ? SELECTED_MARKER_SVG : NORMAL_MARKER_SVG,
        new kakaoMaps.Size(isSelected ? 30 : 20, isSelected ? 30 : 20),
      );

      const existingMarker = markersRef.current.get(location.vehicleId);
      if (existingMarker) {
        existingMarker.setPosition(position);
        existingMarker.setImage(image);
      } else {
        const marker = new kakaoMaps.Marker({ position, map, image });
        markersRef.current.set(location.vehicleId, marker);
      }
    }

    const idsKey = vehicleIdsKey(locations);
    if (locations.length > 0 && idsKey !== fittedIdsKeyRef.current) {
      fittedIdsKeyRef.current = idsKey;
      if (locations.length === 1) {
        const only = locations[0];
        map.setCenter(new kakaoMaps.LatLng(only.lat, only.lng));
        map.setLevel(5);
      } else {
        const bounds = new kakaoMaps.LatLngBounds();
        for (const location of locations) {
          bounds.extend(new kakaoMaps.LatLng(location.lat, location.lng));
        }
        map.setBounds(bounds);
      }
    }

    if (selectedVehicleId) {
      const selected = locations.find(
        (location) => location.vehicleId === selectedVehicleId,
      );
      // panTo only when the selection changes — not on every 2s GPS tick.
      if (selected && lastPannedVehicleIdRef.current !== selectedVehicleId) {
        lastPannedVehicleIdRef.current = selectedVehicleId;
        map.panTo(new kakaoMaps.LatLng(selected.lat, selected.lng));
      }
    } else {
      lastPannedVehicleIdRef.current = null;
    }
  }, [locations, selectedVehicleId, status]);

  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const marker of markers.values()) {
        marker.setMap(null);
      }
      markers.clear();
    };
  }, []);

  const selectedLocation = locations.find(
    (location) => location.vehicleId === selectedVehicleId,
  );
  const liveMessage = !selectedVehicleId
    ? ""
    : !selectedLocation
      ? status === "ready"
        ? "선택한 차량의 실시간 위치가 없습니다."
        : "선택한 차량 — 지도를 사용할 수 없어 위치를 표시할 수 없습니다."
      : status === "ready"
        ? `지도 중심이 ${selectedLocation.plateNumber} 위치로 이동했습니다.`
        : `${selectedLocation.plateNumber} 선택됨 — 지도를 사용할 수 없어 위치를 표시할 수 없습니다.`;

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

        <span className="flex items-center gap-0.5 text-[13px] font-medium tracking-[-0.325px] text-dashboard-text-tertiary">
          전체
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-4 min-h-[320px] overflow-hidden rounded-lg">
        {status === "unavailable" || status === "error" ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border bg-dashboard-surface px-4 text-center">
            <MapPinOff
              aria-hidden="true"
              className="h-8 w-8 text-dashboard-text-tertiary"
            />
            <p className="m-0 text-sm font-medium text-dashboard-text-primary">
              지도를 불러올 수 없습니다
            </p>
            <p className="m-0 max-w-xs text-xs text-dashboard-text-muted">
              차량 위치는 오른쪽 알림 목록에서 확인해주세요.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="h-full min-h-[320px] w-full" />
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
    </section>
  );
}
