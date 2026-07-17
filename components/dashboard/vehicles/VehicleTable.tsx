import { useState } from "react";
import Link from "next/link";
import { Car } from "lucide-react";

import type {
  VehicleListItem,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import {
  formatTireStatusLabel,
  formatVehicleListDateLabel,
} from "@/lib/dashboard/vehicles/format";

const STATUS_BADGE_STYLES: Record<
  VehicleManagementStatus,
  { bg: string; text: string; label: string }
> = {
  AVAILABLE: {
    bg: "bg-dashboard-status-available-bg",
    text: "text-dashboard-status-available",
    label: "대여 가능",
  },
  RENTED: {
    bg: "bg-dashboard-status-rented-bg",
    text: "text-dashboard-status-rented",
    label: "대여 중",
  },
  REPAIR: {
    bg: "bg-dashboard-status-repair-bg",
    text: "text-dashboard-status-repair",
    label: "운행 불가",
  },
};

/**
 * Thumbnail with an icon fallback. `imageUrl` is a confirmed non-null DTO
 * field (`.claude/handoffs/14-api-specs.md`), but the actual asset/CDN is
 * unconfirmed (Figma sample rows all reuse one placeholder-looking image) —
 * a broken/unreachable URL falls back to a neutral car icon instead of a
 * broken-image glyph.
 */
function VehicleThumbnail({
  imageUrl,
  alt,
}: {
  imageUrl: string;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-dashboard-vehicles-surface">
        <Car aria-hidden="true" className="h-5 w-5 text-dashboard-vehicles-label" />
        <span className="sr-only">{alt}</span>
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={() => setHasError(true)}
      className="h-12 w-16 shrink-0 rounded-md object-cover"
    />
  );
}

function VehicleStatusBadge({ status }: { status: VehicleManagementStatus }) {
  const style = STATUS_BADGE_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

/** Mobile-only inline column label — hidden at `md:` where the real `<th>` takes over. */
function CellLabel({ children }: { children: string }) {
  return (
    <span className="mr-2 shrink-0 text-xs font-medium text-dashboard-vehicles-label md:hidden">
      {children}
    </span>
  );
}

/**
 * Vehicle list table (issue #14, Figma "Vehicle List Section" node
 * 2467:25966). Columns: 이미지 · 차량정보 · 상태 · 타이어 · 대여일 · 반납일
 * (Confirmed Layout Facts, `.claude/handoffs/14-figma-specs.md`).
 *
 * `manufacturer`/`vehicleType`/`fuelType` have no dedicated Figma column (PM
 * Decision 8) — `manufacturer` is shown as non-disruptive secondary text next
 * to the model name; `vehicleType`/`fuelType` stay on the DTO but are not
 * rendered.
 *
 * A single `<table>` reflows via CSS display overrides at the `md:` breakpoint
 * instead of rendering two separate desktop/mobile DOM trees — this keeps one
 * source of truth per vehicle row (no duplicated text nodes to keep in sync)
 * while still satisfying AC8 (no horizontal scroll under 768px): below `md:`,
 * `<thead>` is hidden and each `<td>` becomes a block with an inline
 * {@link CellLabel}; overriding a table element's `display` away from
 * `table*` also drops its implicit ARIA table semantics in evergreen
 * browsers, so screen readers don't announce a confusing "1-column table" on
 * narrow viewports.
 *
 * (Issue #15, PM AC1/AC2) Each row links to `/dashboard/vehicles/{vehicleId}`
 * via a "stretched link": the `<tr>` is `position: relative` and the `<Link>`
 * lives inside the last `<td>` as `absolute inset-0`, so it visually covers
 * the whole row (click/keyboard-focus anywhere) without adding an extra
 * unlabeled `<td>` that would misalign the 6-column `<thead>`. The link's own
 * text is empty/`aria-hidden` — its accessible name comes from `aria-label`,
 * since the row's visible text (plate number, model, status…) already sits in
 * separate sibling `<td>`s that a plain nested `<a>` text label couldn't
 * describe together.
 */
export function VehicleTable({ vehicles }: { vehicles: VehicleListItem[] }) {
  return (
    <div className="max-h-[560px] overflow-y-auto rounded-lg border border-dashboard-vehicles-border">
      <table className="block w-full border-collapse md:table">
        <caption className="sr-only">{vehicles.length}대의 차량 목록</caption>
        <thead className="hidden md:table-header-group">
          <tr className="border-b border-dashboard-vehicles-border bg-dashboard-vehicles-surface text-left text-xs font-medium text-dashboard-vehicles-label">
            <th scope="col" className="px-3 py-2">
              이미지
            </th>
            <th scope="col" className="px-3 py-2">
              차량정보
            </th>
            <th scope="col" className="px-3 py-2">
              상태
            </th>
            <th scope="col" className="px-3 py-2">
              타이어
            </th>
            <th scope="col" className="px-3 py-2">
              대여일
            </th>
            <th scope="col" className="px-3 py-2">
              반납일
            </th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {vehicles.map((vehicle) => (
            <tr
              key={vehicle.vehicleId}
              className="relative flex flex-col gap-2 border-b border-dashboard-vehicles-border p-3 outline-none last:border-b-0 hover:bg-dashboard-vehicles-surface/60 md:table-row md:gap-0 md:p-0"
            >
              <td className="flex items-center md:table-cell md:px-3 md:py-2 md:align-middle">
                <VehicleThumbnail
                  imageUrl={vehicle.imageUrl}
                  alt={`${vehicle.model} 사진`}
                />
              </td>
              <td className="md:table-cell md:px-3 md:py-2 md:align-middle">
                <p className="m-0 truncate text-sm font-semibold text-dashboard-vehicles-title">
                  {vehicle.plateNumber}
                </p>
                <p className="m-0 truncate text-xs text-dashboard-vehicles-label">
                  {vehicle.manufacturer} {vehicle.model} · {vehicle.modelYear}
                </p>
              </td>
              <td className="flex items-center md:table-cell md:px-3 md:py-2 md:align-middle">
                <CellLabel>상태</CellLabel>
                <VehicleStatusBadge status={vehicle.status} />
              </td>
              <td className="flex items-center text-sm text-dashboard-vehicles-title md:table-cell md:px-3 md:py-2 md:align-middle">
                <CellLabel>타이어</CellLabel>
                {formatTireStatusLabel(vehicle.tireStatus)}
              </td>
              <td className="flex items-center text-sm text-dashboard-vehicles-title md:table-cell md:px-3 md:py-2 md:align-middle">
                <CellLabel>대여일</CellLabel>
                {formatVehicleListDateLabel(vehicle.rentedAt)}
              </td>
              <td className="flex items-center text-sm text-dashboard-vehicles-title md:table-cell md:px-3 md:py-2 md:align-middle">
                <CellLabel>반납일</CellLabel>
                {formatVehicleListDateLabel(vehicle.returnedAt)}
                <Link
                  href={`/dashboard/vehicles/${vehicle.vehicleId}`}
                  aria-label={`${vehicle.plateNumber} ${vehicle.manufacturer} ${vehicle.model} 상세보기`}
                  className="absolute inset-0 z-10 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
