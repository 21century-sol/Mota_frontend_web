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
        className={`flex items-center justify-center rounded-2xl bg-dashboard-vehicles-surface ${className}`}
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
      className={`rounded-2xl object-cover ${className}`}
    />
  );
}

/**
 * Car Info panel (issue #42, Figma "Car Info Container" node 1:13848):
 * photo + thumbnails, identity fields, options and the 3 Car Stats.
 * `vehicle.tireStatus` (from `getVehicleDetail`, confirmed non-null) is used
 * directly for the "타이어상태" stat — this panel no longer calls
 * `useVehicleTireDetail`/`/tires`, which was a separate, unrelated endpoint
 * (issue #42 breaking change from #15).
 *
 * `manufacturer + " " + model` is rendered as the 차종 label with no
 * brackets/`modelCode` (PM confirmed display rule) — Figma's node shows a
 * bracketed `[manufacturer model modelCode]` style, a known, already-resolved
 * visual difference (`.claude/handoffs/42-figma-specs.md` Confirmed Design
 * Facts).
 */
export function VehicleInfoPanel({ vehicle }: { vehicle: VehicleDetailDto }) {
  const mainPhoto = vehicle.imageUrls[0];
  const thumbnails = vehicle.imageUrls.slice(1);

  return (
    <section
      aria-labelledby="vehicle-info-heading"
      className="flex flex-col gap-5 rounded-dashboard-card bg-white p-6 shadow-dashboard-card"
    >
      <h2 id="vehicle-info-heading" className="sr-only">
        차량 기본 정보
      </h2>

      {mainPhoto ? (
        <VehiclePhoto src={mainPhoto} alt={`${vehicle.model} 사진`} className="h-56 w-full" />
      ) : (
        <div className="flex h-56 w-full items-center justify-center rounded-2xl bg-dashboard-vehicles-surface">
          <Car aria-hidden="true" className="h-10 w-10 text-dashboard-vehicles-label" />
          <span className="sr-only">등록된 차량 사진이 없습니다.</span>
        </div>
      )}

      {thumbnails.length > 0 ? (
        <ul className="flex gap-3">
          {thumbnails.map((url, index) => (
            <li key={url}>
              <VehiclePhoto
                src={url}
                alt={`${vehicle.model} 추가 사진 ${index + 1}`}
                className="h-16 w-20"
              />
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <p className="m-0 text-lg font-semibold text-dashboard-vehicles-title">
          {vehicle.plateNumber}
        </p>
        <p className="m-0 text-sm text-dashboard-vehicles-label">
          {vehicle.manufacturer} {vehicle.model} · {vehicle.modelYear}년식 ·{" "}
          {formatVehicleInfoFuelTypeLabel(vehicle.fuelType)}
        </p>
      </div>

      <div>
        <h3 className="m-0 mb-2 text-sm font-medium text-dashboard-vehicles-label">차량 옵션</h3>
        {vehicle.options.length === 0 ? (
          <p className="m-0 text-sm text-dashboard-vehicles-label">{NO_VALUE_PLACEHOLDER}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {vehicle.options.map((option) => (
              <li
                key={option}
                className="rounded bg-dashboard-vehicles-surface px-3 py-1 text-xs text-dashboard-vehicles-title"
              >
                {formatVehicleOptionLabel(option)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-dashboard-vehicles-border pt-4">
        <div>
          <dt className="m-0 text-xs text-dashboard-vehicles-label">누적 주행거리</dt>
          <dd className="m-0 mt-1 text-sm font-semibold text-dashboard-vehicles-title">
            {vehicle.mileage.toLocaleString("ko-KR")}km
          </dd>
        </div>
        <div>
          <dt className="m-0 text-xs text-dashboard-vehicles-label">최근 점검일</dt>
          <dd className="m-0 mt-1 text-sm font-semibold text-dashboard-vehicles-title">
            {formatVehicleDateLabel(vehicle.lastInspectedAt)}
          </dd>
        </div>
        <div>
          <dt className="m-0 text-xs text-dashboard-vehicles-label">타이어 상태</dt>
          <dd className="m-0 mt-1 text-sm font-semibold text-dashboard-vehicles-title">
            {formatTireStatusLabel(vehicle.tireStatus)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
