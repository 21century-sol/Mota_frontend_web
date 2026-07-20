"use client";

import { useState } from "react";
import { Car } from "lucide-react";

import type { VehicleDetailDto } from "@/types/dashboard/vehicle";
import {
  NO_VALUE_PLACEHOLDER,
  formatTireStatusLabel,
  formatVehicleDateLabel,
  formatVehicleInfoFuelTypeLabel,
  formatVehicleOptionLabel,
} from "@/lib/dashboard/vehicles/format";

function VehiclePhoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        className={`flex items-center justify-center rounded-lg border border-dashboard-vehicles-image-border bg-dashboard-vehicles-surface ${className}`}
      >
        <Car aria-hidden="true" className="h-8 w-8 text-dashboard-vehicles-label" />
        <span className="sr-only">{alt}</span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`rounded-lg border border-dashboard-vehicles-image-border object-cover ${className}`}
    />
  );
}

/**
 * Car Info 요약 배너 (issue #53, Figma "Car Info Container" node 1:13848):
 * 대표 이미지+썸네일을 좌측에 두고 차량 식별 정보/옵션을 우측에 가로로 병치하며,
 * 하단에 통계(누적 주행 거리·최근 점검일·타이어 상태)를 세로 구분선으로 3분할한
 * 전체폭 가로 배너다. (#42까지의 세로 카드 레이아웃을 대체 — 데이터/서버 연동은
 * 그대로 유지하고 레이아웃만 Figma에 정합.)
 *
 * `manufacturer + " " + model`을 차종으로 렌더하며 대괄호/`modelCode`는 붙이지
 * 않는다(#42에서 확정된 표기, #53 non-goal). Figma의 대표 이미지 `1/N` 카운터는
 * 캐러셀이 없으므로 현재 인덱스는 항상 1로 표시한다.
 */
export function VehicleInfoPanel({ vehicle }: { vehicle: VehicleDetailDto }) {
  const mainPhoto = vehicle.imageUrls[0];
  const thumbnails = vehicle.imageUrls.slice(1, 4);
  const photoCount = vehicle.imageUrls.length;

  return (
    <section
      aria-labelledby="vehicle-info-heading"
      className="rounded-dashboard-card bg-white p-6 shadow-dashboard-card"
    >
      <h2 id="vehicle-info-heading" className="sr-only">
        차량 기본 정보
      </h2>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <div className="flex shrink-0 flex-col gap-2">
          <div className="relative">
            {mainPhoto ? (
              <VehiclePhoto
                src={mainPhoto}
                alt={`${vehicle.model} 사진`}
                className="h-[235px] w-full lg:w-[353px]"
              />
            ) : (
              <div className="flex h-[235px] w-full items-center justify-center rounded-lg border border-dashboard-vehicles-image-border bg-dashboard-vehicles-surface lg:w-[353px]">
                <Car aria-hidden="true" className="h-10 w-10 text-dashboard-vehicles-label" />
                <span className="sr-only">등록된 차량 사진이 없습니다.</span>
              </div>
            )}

            {photoCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-xs text-white">
                <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                  <span className="font-semibold">1</span>
                  <span>/</span>
                  <span>{photoCount}</span>
                </span>
                <span className="sr-only">전체 {photoCount}장 중 1번째 사진</span>
              </span>
            ) : null}
          </div>

          {thumbnails.length > 0 ? (
            <ul className="flex gap-2">
              {thumbnails.map((url, index) => (
                <li key={url}>
                  <VehiclePhoto
                    src={url}
                    alt={`${vehicle.model} 추가 사진 ${index + 1}`}
                    className="h-[75px] w-[112px]"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:pt-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="m-0 text-2xl font-semibold text-dashboard-text-primary">
                  {vehicle.plateNumber}
                </p>
                <p className="m-0 text-xl font-medium text-dashboard-account-text">
                  {vehicle.manufacturer} {vehicle.model}
                </p>
              </div>
              <p className="m-0 text-base text-dashboard-text-muted">
                {vehicle.modelYear}년식 · {formatVehicleInfoFuelTypeLabel(vehicle.fuelType)}
              </p>
            </div>

            <div>
              <h3 className="m-0 mb-2 text-sm font-semibold text-dashboard-vehicles-label">
                차량 옵션
              </h3>
              {vehicle.options.length === 0 ? (
                <p className="m-0 text-sm text-dashboard-text-muted">{NO_VALUE_PLACEHOLDER}</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {vehicle.options.map((option) => (
                    <li
                      key={option}
                      className="rounded border border-dashboard-vehicles-border px-2.5 py-1 text-sm font-medium text-dashboard-text-muted"
                    >
                      {formatVehicleOptionLabel(option)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <dl className="mt-auto grid grid-cols-3 border-t border-dashboard-vehicles-border pt-6 text-center">
            <div className="flex flex-col items-center gap-1 border-r border-dashboard-vehicles-border px-4">
              <dt className="m-0 text-sm text-dashboard-text-muted">누적 주행 거리</dt>
              <dd className="m-0 text-lg font-semibold text-dashboard-vehicles-title">
                {vehicle.mileage.toLocaleString("ko-KR")} km
              </dd>
            </div>
            <div className="flex flex-col items-center gap-1 border-r border-dashboard-vehicles-border px-4">
              <dt className="m-0 text-sm text-dashboard-text-muted">최근 점검일</dt>
              <dd className="m-0 text-lg font-semibold text-dashboard-vehicles-title">
                {formatVehicleDateLabel(vehicle.lastInspectedAt)}
              </dd>
            </div>
            <div className="flex flex-col items-center gap-1 px-4">
              <dt className="m-0 text-sm text-dashboard-text-muted">타이어 상태</dt>
              <dd className="m-0 text-lg font-semibold text-dashboard-vehicles-title">
                {formatTireStatusLabel(vehicle.tireStatus)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
