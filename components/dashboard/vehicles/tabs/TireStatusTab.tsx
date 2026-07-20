"use client";

import { useState } from "react";
import { AlertTriangle, Car } from "lucide-react";

import type { TireDetail, TireTrendMetric, WheelPosition } from "@/types/dashboard/vehicle";
import { TIRE_TREND_METRICS, WHEEL_POSITIONS } from "@/types/dashboard/vehicle";
import { VehicleTireDetailFetchError } from "@/lib/dashboard/vehicles/tire-detail-api";
import {
  isTireTrendPointsEmpty,
  toTireTrendPoints,
  VehicleTireTrendFetchError,
} from "@/lib/dashboard/vehicles/tire-trend-api";
import {
  formatAlignmentLabel,
  formatExpectedReplacementLabel,
  formatPressureLabel,
  formatTemperatureLabel,
  formatTireTrendMetricLabel,
  formatWearLabel,
  formatWheelPositionLabel,
} from "@/lib/dashboard/vehicles/format";
import { countTiresNeedingAttention, hasTireNeedingAttention } from "@/lib/dashboard/vehicles/tire";
import { useVehicleTireDetail } from "@/hooks/dashboard/useVehicleTireDetail";
import { useVehicleTireTrend } from "@/hooks/dashboard/useVehicleTireTrend";
import { TireTrendChart } from "@/components/dashboard/vehicles/tabs/TireTrendChart";

/** Position on the car-image overlay (issue #15 Safe Assumption A3 — exact Figma "Bar Indicator" spec unconfirmed, ui-agent discretion). */
const OVERLAY_POSITION_STYLE: Record<WheelPosition, string> = {
  FL: "left-[28%] top-[30%]",
  FR: "right-[28%] top-[30%]",
  RL: "left-[28%] bottom-[22%]",
  RR: "right-[28%] bottom-[22%]",
};

const OVERLAY_STATUS_STYLE: Record<TireDetail["status"], string> = {
  NORMAL: "bg-dashboard-vehicles-label/40",
  CAUTION: "bg-dashboard-tire-caution motion-safe:animate-ping",
  WARNING: "bg-dashboard-tire-warning motion-safe:animate-ping",
};

/**
 * Car-image overlay highlighting the 4 wheel positions (Figma "Car Image
 * Overlay", PM AC17). Highlight color/animation comes from `tire.status`
 * only, never from the raw measurement values
 * (`.claude/handoffs/15-figma-specs.md` "Discovered Mock Inconsistencies").
 * `motion-safe:` keeps the pulse animation off for `prefers-reduced-motion`
 * users; the color itself still conveys the state either way.
 */
function TireOverlay({
  tires,
  vehiclePhotoUrl,
  vehicleModel,
}: {
  tires: TireDetail[];
  vehiclePhotoUrl: string | undefined;
  vehicleModel: string;
}) {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-dashboard-vehicles-surface">
      {vehiclePhotoUrl ? (
        <img
          src={vehiclePhotoUrl}
          alt={`${vehicleModel} 타이어 위치도`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Car aria-hidden="true" className="h-10 w-10 text-dashboard-vehicles-label" />
        </div>
      )}
      {tires.map((tire) => (
        <span
          key={tire.position}
          aria-hidden="true"
          className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${OVERLAY_POSITION_STYLE[tire.position]} ${OVERLAY_STATUS_STYLE[tire.status]}`}
        />
      ))}
    </div>
  );
}

function TireCard({ tire }: { tire: TireDetail }) {
  return (
    <div className="rounded-dashboard-tire-card border border-dashboard-vehicles-border p-4 shadow-dashboard-tire-card">
      <p className="m-0 text-sm font-semibold text-dashboard-vehicles-title">
        {formatWheelPositionLabel(tire.position)}
      </p>
      <p className="m-0 mt-1 text-xs text-dashboard-vehicles-label">
        예상 교체 시점 {formatExpectedReplacementLabel(tire.expectedReplacementAt)}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="m-0 text-dashboard-vehicles-label">공기압</dt>
          <dd className="m-0 font-medium text-dashboard-vehicles-title">
            {formatPressureLabel(tire.pressureKpa)}
          </dd>
        </div>
        <div>
          <dt className="m-0 text-dashboard-vehicles-label">온도</dt>
          <dd className="m-0 font-medium text-dashboard-vehicles-title">
            {formatTemperatureLabel(tire.temperatureCelsius)}
          </dd>
        </div>
        <div>
          <dt className="m-0 text-dashboard-vehicles-label">휠 얼라이먼트</dt>
          <dd className="m-0 font-medium text-dashboard-vehicles-title">
            {formatAlignmentLabel(tire.alignmentDeg)}
          </dd>
        </div>
        <div>
          <dt className="m-0 text-dashboard-vehicles-label">마모도</dt>
          <dd className="m-0 font-medium text-dashboard-vehicles-title">
            {formatWearLabel(tire.treadDepthMm)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * "타이어" tab (issue #15, PM AC15-AC18, default tab). Owns 2 independent
 * queries: `useVehicleTireDetail` (banner + overlay + 4 cards) and
 * `useVehicleTireTrend` (chart — one fetch for all metrics; metric toggle
 * filters client-side via `toTireTrendPoints`).
 */
export function TireStatusTab({
  vehicleId,
  vehiclePhotoUrl,
  vehicleModel,
}: {
  vehicleId: string;
  vehiclePhotoUrl: string | undefined;
  vehicleModel: string;
}) {
  const [metric, setMetric] = useState<TireTrendMetric>("PRESSURE");
  const tireDetailQuery = useVehicleTireDetail(vehicleId);
  const tireTrendQuery = useVehicleTireTrend(vehicleId);
  const trendPoints =
    tireTrendQuery.data !== undefined ? toTireTrendPoints(tireTrendQuery.data, metric) : [];
  const trendEmpty = isTireTrendPointsEmpty(trendPoints);

  return (
    <div className="flex flex-col gap-6">
      <div aria-busy={tireDetailQuery.isPending}>
        {tireDetailQuery.isError ? (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-dashboard-card bg-white p-6 shadow-dashboard-card">
            <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
              {tireDetailQuery.error instanceof VehicleTireDetailFetchError
                ? tireDetailQuery.error.userMessage
                : "타이어 정보를 불러오지 못했습니다."}
            </p>
            <button
              type="button"
              onClick={() => tireDetailQuery.refetch()}
              disabled={tireDetailQuery.isFetching}
              aria-busy={tireDetailQuery.isFetching}
              className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {tireDetailQuery.isFetching ? "다시 시도하는 중..." : "다시 시도"}
            </button>
          </div>
        ) : tireDetailQuery.isPending ? (
          <p className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label">
            타이어 정보를 불러오는 중입니다.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {hasTireNeedingAttention(tireDetailQuery.data) ? (
              <div className="flex items-center gap-2 rounded-dashboard-banner bg-dashboard-chart-accent px-5 py-4 text-white">
                <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0" />
                <p className="m-0 text-sm font-medium">
                  점검이 필요한 타이어가 {countTiresNeedingAttention(tireDetailQuery.data)}개
                  있습니다
                </p>
              </div>
            ) : null}

            <TireOverlay
              tires={tireDetailQuery.data}
              vehiclePhotoUrl={vehiclePhotoUrl}
              vehicleModel={vehicleModel}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHEEL_POSITIONS.map((position) => {
                const tire = tireDetailQuery.data.find((entry) => entry.position === position);
                return tire ? <TireCard key={position} tire={tire} /> : null;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-dashboard-card bg-white p-6 shadow-dashboard-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-lg font-semibold tracking-tight text-dashboard-vehicles-title">
            타이어 상태 추이
          </h3>
          <div
            role="group"
            aria-label="상태 추이 지표 선택"
            className="flex flex-wrap rounded-full bg-white p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
          >
            {TIRE_TREND_METRICS.map((option) => {
              const isSelected = option === metric;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setMetric(option)}
                  className={[
                    "min-w-[100px] rounded-full px-4 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-dashboard-chart-accent",
                    isSelected
                      ? "bg-dashboard-chart-accent font-semibold text-white shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
                      : "font-medium text-dashboard-vehicles-label hover:text-dashboard-vehicles-title",
                  ].join(" ")}
                >
                  {formatTireTrendMetricLabel(option)}
                </button>
              );
            })}
          </div>
        </div>

        <div aria-busy={tireTrendQuery.isPending}>
          {tireTrendQuery.isError ? (
            <div role="alert" className="flex flex-col items-start gap-2 py-6">
              <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
                {tireTrendQuery.error instanceof VehicleTireTrendFetchError
                  ? tireTrendQuery.error.userMessage
                  : "타이어 상태 추이를 불러오지 못했습니다."}
              </p>
              <button
                type="button"
                onClick={() => tireTrendQuery.refetch()}
                disabled={tireTrendQuery.isFetching}
                aria-busy={tireTrendQuery.isFetching}
                className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {tireTrendQuery.isFetching ? "다시 시도하는 중..." : "다시 시도"}
              </button>
            </div>
          ) : tireTrendQuery.isPending ? (
            <p className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label">
              상태 추이를 불러오는 중입니다.
            </p>
          ) : trendEmpty ? (
            <p role="status" className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label">
              표시할 상태 추이 데이터가 없습니다.
            </p>
          ) : (
            <TireTrendChart points={trendPoints} />
          )}
        </div>
      </div>
    </div>
  );
}
