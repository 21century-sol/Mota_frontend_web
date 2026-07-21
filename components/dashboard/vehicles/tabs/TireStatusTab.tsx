"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { TireDetail, TireTrendMetric, WheelPosition } from "@/types/dashboard/vehicle";
import { TIRE_TREND_METRICS } from "@/types/dashboard/vehicle";
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
import { TirePulse } from "@/components/dashboard/vehicles/TirePulse";

/** Figma node 1:13926 탑다운 차량 일러스트 (실사 사진이 아님). */
const TIRE_CAR_ASSET = "/assets/dashboard/tire-car-topdown.png";
/** Figma node 1:13929 타이어 휠 오버레이. */
const TIRE_WHEEL_ASSET = "/assets/dashboard/tire-wheel.png";

/**
 * Figma node 1:13925 Car Image 기준 바퀴 좌표.
 * 컨테이너(259×345) 중심 대비 px 오프셋.
 * FL/FR: top 50%-41.5px, RL/RR: top 50%+88.5px / left ±58px.
 */
const DIAGRAM_POSITION_STYLE: Record<WheelPosition, string> = {
  FL: "left-[calc(50%-58.5px)] top-[calc(50%-41.5px)]",
  FR: "left-[calc(50%+57.5px)] top-[calc(50%-41.5px)]",
  RL: "left-[calc(50%-58.5px)] top-[calc(50%+88.5px)]",
  RR: "left-[calc(50%+57.5px)] top-[calc(50%+88.5px)]",
};

/**
 * 중앙 차량 도식 (Figma node 1:13925).
 * 차량은 항상 Figma 탑다운 에셋을 쓰고, 바퀴마다 휠 아이콘 + (주의/위험 시) 펄스를 올린다.
 * 정상 타이어의 Figma 흰 블러 글로우는 밝은 차량 위에서 흰 박스로 보여 생략한다.
 */
function TireDiagram({ tires }: { tires: TireDetail[] }) {
  return (
    <div className="relative mx-auto h-[345px] w-[259px] shrink-0">
      <img
        src={TIRE_CAR_ASSET}
        alt="타이어 위치 차량 도식"
        className="pointer-events-none absolute inset-0 size-full object-contain opacity-80"
      />
      {tires.map((tire) => (
        <div
          key={tire.position}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${DIAGRAM_POSITION_STYLE[tire.position]}`}
        >
          <div className="relative flex size-[63px] items-center justify-center">
            {tire.status !== "NORMAL" ? (
              // Figma 오버레이(~63px)에 맞춰 원본 108px 펄스를 축소한다.
              <div className="pointer-events-none absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.58]">
                <TirePulse status={tire.status} />
              </div>
            ) : null}
            <img
              src={TIRE_WHEEL_ASSET}
              alt=""
              aria-hidden="true"
              className="relative z-10 size-[63px] object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 실시간 센서 카드 (Figma node 1:13961 Front Left Tire Container).
 * 상태 뱃지/강조 테두리는 카드에 두지 않고, 차량 도식 펄스로만 상태를 표현한다.
 */
function TireCard({ tire }: { tire: TireDetail }) {
  return (
    <div className="w-full max-w-[260px] overflow-hidden rounded-dashboard-tire-card border border-dashboard-vehicles-border bg-white p-4 shadow-dashboard-tire-card">
      <div className="flex flex-col gap-3 leading-[1.5]">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-base font-semibold tracking-[-0.4px] text-dashboard-vehicles-title">
            {formatWheelPositionLabel(tire.position)}
          </p>
          <p className="m-0 text-sm font-medium tracking-[-0.35px] text-dashboard-vehicles-label">
            예상 교체 시점 {formatExpectedReplacementLabel(tire.expectedReplacementAt)}
          </p>
        </div>
        <dl className="m-0 flex flex-col gap-1.5 text-sm font-medium tracking-[-0.35px]">
          {(
            [
              ["공기압", formatPressureLabel(tire.pressureKpa)],
              ["온도", formatTemperatureLabel(tire.temperatureCelsius)],
              ["휠 얼라이먼트", formatAlignmentLabel(tire.alignmentDeg)],
              ["마모도", formatWearLabel(tire.treadDepthMm)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-center">
              <dt className="m-0 w-[100px] shrink-0 text-dashboard-vehicles-label">{label}</dt>
              <dd className="m-0 min-w-0 flex-1 text-dashboard-vehicles-title">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/**
 * "타이어" tab (issue #15, PM AC15-AC18, default tab). Owns 2 independent
 * queries: `useVehicleTireDetail` (banner + overlay + 4 cards) and
 * `useVehicleTireTrend` (chart — one fetch for all metrics; metric toggle
 * filters client-side via `toTireTrendPoints`).
 */
export function TireStatusTab({ vehicleId }: { vehicleId: string }) {
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

            {/* Figma node 1:13920 Detail Container: 제목 + 탑다운 차량 + 좌우 센서 카드 4개.
                lg 이상은 [FL·RL] | 차량 | [FR·RR] 3열, 좁은 화면은 차량이 위로 오고
                카드가 아래로 쌓인다. 데이터는 2초 폴링으로 갱신된다. */}
            <div className="flex flex-col gap-5">
              <h3 className="m-0 pl-3 text-lg font-semibold tracking-[-0.45px] text-dashboard-text-primary">
                타이어 상세
              </h3>
              <div className="rounded-dashboard-card bg-white px-6 py-6 shadow-dashboard-card">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)] lg:items-center">
                  <div className="order-2 flex flex-col items-stretch gap-4 lg:order-1 lg:items-start">
                    {(["FL", "RL"] as const).map((position) => {
                      const tire = tireDetailQuery.data.find((entry) => entry.position === position);
                      return tire ? <TireCard key={position} tire={tire} /> : null;
                    })}
                  </div>
                  <div className="order-1 flex justify-center lg:order-2">
                    <TireDiagram tires={tireDetailQuery.data} />
                  </div>
                  <div className="order-3 flex flex-col items-stretch gap-4 lg:items-end">
                    {(["FR", "RR"] as const).map((position) => {
                      const tire = tireDetailQuery.data.find((entry) => entry.position === position);
                      return tire ? <TireCard key={position} tire={tire} /> : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <section
        aria-labelledby="tire-trend-heading"
        className="flex flex-col gap-3"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 pl-3">
          <h3
            id="tire-trend-heading"
            className="m-0 text-lg font-semibold tracking-[-0.45px] text-dashboard-text-primary"
          >
            타이어 상태 추이
          </h3>
          <div
            role="group"
            aria-label="상태 추이 지표 선택"
            className="flex max-w-full overflow-x-auto rounded-full bg-white p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
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
                    "w-[100px] shrink-0 whitespace-nowrap rounded-full border-2 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-dashboard-chart-accent",
                    isSelected
                      ? "border-dashboard-chart-accent bg-dashboard-chart-accent font-semibold text-white shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
                      : "border-transparent font-medium text-dashboard-vehicles-label hover:text-dashboard-vehicles-title",
                  ].join(" ")}
                >
                  {formatTireTrendMetricLabel(option)}
                </button>
              );
            })}
          </div>
        </header>

        <div
          data-testid="tire-trend-chart-card"
          className="h-[356px] overflow-hidden rounded-[24px] bg-white p-6 shadow-dashboard-card"
        >
          <div aria-busy={tireTrendQuery.isPending} className="h-full">
            {tireTrendQuery.isError ? (
              <div
                role="alert"
                className="flex h-full flex-col items-start justify-center gap-2"
              >
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
                  {tireTrendQuery.isFetching
                    ? "다시 시도하는 중..."
                    : "다시 시도"}
                </button>
              </div>
            ) : tireTrendQuery.isPending ? (
              <p className="m-0 flex h-full items-center justify-center text-sm text-dashboard-vehicles-label">
                상태 추이를 불러오는 중입니다.
              </p>
            ) : trendEmpty ? (
              <p
                role="status"
                className="m-0 flex h-full items-center justify-center text-sm text-dashboard-vehicles-label"
              >
                표시할 상태 추이 데이터가 없습니다.
              </p>
            ) : (
              <TireTrendChart points={trendPoints} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
