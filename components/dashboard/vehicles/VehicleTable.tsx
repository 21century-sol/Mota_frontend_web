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

/**
 * Outline pill + 6px dot status badge (issue #35 AC14) — reuses the exact
 * pattern from `components/dashboard/reservations/ReservationStatusBadge.tsx`
 * (transparent background, 1px border, dot `bg-current`) instead of the
 * issue #14 colored-fill badge. Border/text/dot all share the existing
 * `dashboard-status-available/rented/repair` tokens (not the `-bg` fill
 * tokens, which stay unused here).
 *
 * Figma's own sample instances are inconsistent about badge font weight
 * (RENTED/REPAIR render SemiBold, one AVAILABLE instance renders Medium) —
 * resolved to SemiBold uniformly for all 3 statuses, matching 2 of the 3
 * confirmed nodes and `ReservationStatusBadge`'s no-per-status-weight
 * convention (`.claude/handoffs/35-figma-analysis.md` Decision, non-blocking).
 */
const STATUS_BADGE_STYLES: Record<
  VehicleManagementStatus,
  { border: string; text: string; dot: string; label: string }
> = {
  AVAILABLE: {
    border: "border-dashboard-status-available",
    text: "text-dashboard-status-available",
    dot: "bg-dashboard-status-available",
    label: "대여 가능",
  },
  RENTED: {
    border: "border-dashboard-status-rented",
    text: "text-dashboard-status-rented",
    dot: "bg-dashboard-status-rented",
    label: "대여 중",
  },
  REPAIR: {
    border: "border-dashboard-status-repair",
    text: "text-dashboard-status-repair",
    dot: "bg-dashboard-status-repair",
    label: "운행 불가",
  },
};

/**
 * Thumbnail with an icon fallback. `imageUrl` is a confirmed non-null DTO
 * field (`.claude/handoffs/14-api-specs.md`), but the actual asset/CDN is
 * unconfirmed (Figma sample rows all reuse one placeholder-looking image) —
 * a broken/unreachable URL falls back to a neutral car icon instead of a
 * broken-image glyph. Sized to the confirmed Figma dimension (120×80px,
 * issue #35).
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
      <span className="flex h-20 w-[120px] shrink-0 items-center justify-center rounded-xl border border-dashboard-vehicles-image-border bg-dashboard-vehicles-surface">
        <Car aria-hidden="true" className="h-6 w-6 text-dashboard-vehicles-label" />
        <span className="sr-only">{alt}</span>
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={() => setHasError(true)}
      className="h-20 w-[120px] shrink-0 rounded-xl border border-dashboard-vehicles-image-border object-cover"
    />
  );
}

function VehicleStatusBadge({ status }: { status: VehicleManagementStatus }) {
  const style = STATUS_BADGE_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold tracking-[-0.35px] ${style.border} ${style.text}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

/** Narrow-viewport inline column label — hidden at `lg:` where the real `<th>` takes over. */
function CellLabel({ children }: { children: string }) {
  return (
    <span className="mr-2 shrink-0 text-xs font-medium text-dashboard-vehicles-label lg:hidden">
      {children}
    </span>
  );
}

/**
 * Vehicle list table (issue #14, restyled for issue #35 Figma "Vehicle List
 * Section" node 1:13334). Columns: 차량정보 · 상태 · 타이어 · 대여일 · 반납일
 * — the standalone "이미지" column from issue #14 is gone; the thumbnail now
 * lives inside the 차량정보 cell (AC12), matching the confirmed 5-column
 * header.
 *
 * `manufacturer`/`vehicleType`/`fuelType` have no dedicated Figma column (PM
 * Decision 8) — `manufacturer` is shown as non-disruptive secondary text next
 * to the model name; `vehicleType`/`fuelType` stay on the DTO but are not
 * rendered.
 *
 * The outer container's background/border/radius (issue #35 AC11) now lives
 * on this component's own wrapping `<div>` instead of a shared card in
 * `VehicleListSection` — this is the only element in the list section with a
 * background/border.
 *
 * A single `<table>` reflows via CSS display overrides at the `lg:` breakpoint
 * instead of rendering two separate desktop/mobile DOM trees — this keeps one
 * source of truth per vehicle row (no duplicated text nodes to keep in sync)
 * while satisfying AC18 (no horizontal scroll under 768px). Below `lg:` the
 * `<thead>` is hidden and the `<tr>` becomes a "media object" card: a CSS grid
 * (`grid-cols-[120px_1fr]`) with the thumbnail pinned to the left column
 * (`row-span-5`) and the plate/model text plus each `<td>`'s inline
 * {@link CellLabel}+value stacked in the right column, so all textual content
 * shares one left edge rather than starting under the thumbnail. The `<td>`s
 * and the thumbnail's inner wrapper use `display: contents` so the flat table
 * markup can participate directly in the row grid; at `lg:` they revert to
 * `table-cell`/`flex` for the desktop table. Overriding a table element's
 * `display` away from `table*` also drops its implicit ARIA table semantics in
 * Chrome/Firefox, so screen readers there don't announce a confusing
 * "1-column table" on narrow viewports — Safari's table-role behavior here is
 * unverified (no real-device pass performed), and this two-level-deep nested
 * `display: contents` pattern also has a documented WebKit/VoiceOver history
 * of dropping subtree content from the accessibility tree; TODO(#35): confirm
 * with a real Safari/VoiceOver pass at a 768–1023px viewport before relying on
 * this for production accessibility, tracked as a known limitation until then.
 * The reflow breakpoint is `lg:` (not `md:`) because the fixed 40/15% desktop
 * layout below only has room at ~1024px+; the 768–1023px band therefore stays
 * on the card layout rather than a squeezed `table-auto` that wraps the CJK
 * status/tire labels vertically (issue #35 review follow-up).
 *
 * (Issue #15, PM AC1/AC2) Each row links to `/dashboard/vehicles/{vehicleId}`
 * via a "stretched link": the `<tr>` is `position: relative` and the `<Link>`
 * lives inside the last `<td>` as `absolute inset-0`, so it visually covers
 * the whole row (click/keyboard-focus anywhere) without adding an extra
 * unlabeled `<td>` that would misalign the 5-column `<thead>`. The link's own
 * text is empty/`aria-hidden` — its accessible name comes from `aria-label`,
 * since the row's visible text (plate number, model, status…) already sits in
 * separate sibling `<td>`s that a plain nested `<a>` text label couldn't
 * describe together.
 */
export function VehicleTable({ vehicles }: { vehicles: VehicleListItem[] }) {
  return (
    <div className="max-h-[560px] overflow-y-auto overflow-x-auto rounded-[24px] border border-dashboard-vehicles-border bg-dashboard-vehicles-surface">
      <table className="block w-full border-collapse lg:table lg:table-fixed">
        <caption className="sr-only">{vehicles.length}대의 차량 목록</caption>
        <thead className="hidden lg:table-header-group">
          <tr className="border-b border-dashboard-vehicles-border text-left text-base font-normal tracking-[-0.4px] text-dashboard-vehicles-label">
            {/*
              Figma header (node 1:13335): the "차량 정보" label is offset ~150px so
              it sits above the vehicle name rather than the thumbnail (row pl 12 +
              thumbnail 120 + gap 18 = 150), and the 4 data columns are equal-width
              (`flex-1` in Figma → `table-fixed` + equal % here). That layout only
              has room at ~1024px+, so the whole desktop table (this `<thead>`
              included) is gated to `lg:`; below `lg:` the rows render as stacked
              cards with inline {@link CellLabel}s (no `<thead>`), which avoids the
              768–1023px squeeze where `table-auto` wrapped the CJK status/tire
              labels vertically (issue #35 review follow-up).
            */}
            <th scope="col" className="px-3 py-3 lg:pl-[150px] lg:pr-3 lg:w-[40%]">
              차량 정보
            </th>
            <th scope="col" className="px-3 py-3 lg:w-[15%]">
              상태
            </th>
            <th scope="col" className="px-3 py-3 lg:w-[15%]">
              타이어
            </th>
            <th scope="col" className="px-3 py-3 lg:w-[15%]">
              대여일
            </th>
            <th scope="col" className="px-3 py-3 lg:w-[15%]">
              반납일
            </th>
          </tr>
        </thead>
        <tbody className="block lg:table-row-group">
          {vehicles.map((vehicle) => (
            <tr
              key={vehicle.vehicleId}
              className="relative grid grid-cols-[120px_1fr] items-start gap-x-[18px] gap-y-1.5 border-b border-dashboard-vehicles-border bg-white p-3 outline-none last:border-b-0 hover:bg-dashboard-vehicles-surface/60 lg:table-row lg:h-[104px] lg:gap-0 lg:p-0"
            >
              <td className="contents lg:table-cell lg:px-3 lg:py-3 lg:align-middle">
                <div className="contents lg:flex lg:items-center lg:gap-[18px]">
                  <span className="row-span-5 self-start lg:contents">
                    <VehicleThumbnail
                      imageUrl={vehicle.imageUrl}
                      alt={`${vehicle.model} 사진`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-xl font-medium tracking-[-0.5px] text-dashboard-text-primary">
                      {vehicle.plateNumber}
                    </p>
                    <p className="m-0 flex items-center gap-2 text-sm font-medium tracking-[-0.35px] text-dashboard-usage-text-muted">
                      <span className="truncate">
                        {vehicle.manufacturer} {vehicle.model}
                      </span>
                      <span
                        aria-hidden="true"
                        className="inline-block h-1 w-1 shrink-0 rounded-full bg-current"
                      />
                      <span className="shrink-0">{vehicle.modelYear}년식</span>
                    </p>
                  </div>
                </div>
              </td>
              <td className="flex min-w-0 items-center lg:table-cell lg:px-3 lg:py-3 lg:align-middle">
                <CellLabel>상태</CellLabel>
                <VehicleStatusBadge status={vehicle.status} />
              </td>
              <td className="flex min-w-0 items-center text-base font-medium tracking-[-0.4px] text-dashboard-account-text lg:table-cell lg:px-3 lg:py-3 lg:align-middle">
                <CellLabel>타이어</CellLabel>
                {formatTireStatusLabel(vehicle.tireStatus)}
              </td>
              <td className="flex min-w-0 items-center text-base font-medium tracking-[-0.4px] text-dashboard-account-text lg:table-cell lg:px-3 lg:py-3 lg:align-middle">
                <CellLabel>대여일</CellLabel>
                {formatVehicleListDateLabel(vehicle.rentedAt)}
              </td>
              <td className="flex min-w-0 items-center text-base font-medium tracking-[-0.4px] text-dashboard-account-text lg:table-cell lg:px-3 lg:py-3 lg:align-middle">
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
