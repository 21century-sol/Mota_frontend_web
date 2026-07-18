"use client";

import { RotateCcw } from "lucide-react";

import type { VehicleListFilters } from "@/types/dashboard/vehicle";
import { VehicleListFetchError } from "@/lib/dashboard/vehicles/api";
import { formatVehicleListRefreshedAtLabel } from "@/lib/dashboard/vehicles/format";
import { useVehicleList } from "@/hooks/dashboard/useVehicleList";
import { VehicleFilterBar } from "@/components/dashboard/vehicles/VehicleFilterBar";
import { VehicleTireStatusFilter } from "@/components/dashboard/vehicles/VehicleTireStatusFilter";
import { VehicleTable } from "@/components/dashboard/vehicles/VehicleTable";
import { VehicleListSkeleton } from "@/components/dashboard/vehicles/VehicleListSkeleton";

/**
 * `/dashboard/vehicles` list section (issue #14, restructured for issue #35
 * Figma root node 1:13203 "차량관리"). Layout order matches the confirmed
 * root frame: status tabs → tire-status filter + update-time/refresh row →
 * vehicle table, with no shared card wrapping all three (AC11) — only
 * `VehicleTable` owns a background/border/radius now
 * (`components/dashboard/vehicles/VehicleTable.tsx`).
 *
 * `filters` is owned by the Server Component page (`app/dashboard/vehicles/page.tsx`),
 * which reads it from the URL `searchParams` — this section has no local
 * filter state of its own. `VehicleFilterBar`/`VehicleTireStatusFilter` write
 * the next URL via `router.replace`; Next.js re-renders the page with the new
 * `searchParams`, flowing a new `filters` prop back down here (CLAUDE.md §4:
 * "정적 route는 page의 searchParams 전달을 우선 검토").
 *
 * Owns loading(skeleton)/error+retry/empty(×2, all-vehicles vs filtered)/success
 * branching (same split as `SummaryCardsSection`/`AlertsAndMapSection`,
 * issue #11/#12); `VehicleTable` only renders once the list is known to be
 * non-empty.
 */
export function VehicleListSection({
  filters,
}: {
  filters: VehicleListFilters;
}) {
  const query = useVehicleList(filters);
  const isFiltered =
    filters.status !== undefined || filters.tireStatus.length > 0;

  /**
   * 0 or exactly 1 selected tire status is already applied server-side
   * (`buildVehiclesUrl` in `lib/dashboard/vehicles/api.ts`) — the response is
   * used as-is. 2+ selected values can't be forwarded to the backend (it only
   * accepts a single `tireStatus` value), so the OR-match across the selected
   * set is applied here instead, excluding vehicles with a `null` tireStatus
   * the same way a single-value filter would (issue #35 AC7/AC8).
   */
  const vehicles =
    query.data && filters.tireStatus.length >= 2
      ? query.data.vehicles.filter(
          (vehicle) =>
            vehicle.tireStatus !== null &&
            filters.tireStatus.includes(vehicle.tireStatus),
        )
      : query.data?.vehicles;

  return (
    // Figma "Vehicle Filter Section" (node 1:13289): gap 24px between the status
    // tabs and the status-filter block, which itself stacks the tire-chip row and
    // the table with a 16px gap (node 1:13307).
    <section aria-labelledby="vehicle-list-heading" className="flex flex-col gap-6">
      <h2 id="vehicle-list-heading" className="sr-only">
        차량 목록
      </h2>

      <VehicleFilterBar
        currentStatus={filters.status}
        currentTireStatus={filters.tireStatus}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <VehicleTireStatusFilter
            currentStatus={filters.status}
            currentTireStatus={filters.tireStatus}
          />

          <div className="flex items-center gap-3">
            {query.data ? (
              <span className="text-sm tracking-[-0.35px] text-dashboard-placeholder">
                {formatVehicleListRefreshedAtLabel(query.data.refreshedAt)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              aria-busy={query.isFetching}
              aria-label="차량 목록 새로고침"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashboard-vehicles-border outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <RotateCcw
                aria-hidden="true"
                className="h-[18px] w-[18px] text-dashboard-vehicles-label"
              />
            </button>
          </div>
        </div>

        <div aria-busy={query.isPending}>
          {query.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
                {query.error instanceof VehicleListFetchError
                  ? query.error.userMessage
                  : "차량 목록을 불러오지 못했습니다."}
              </p>
              <button
                type="button"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
                aria-busy={query.isFetching}
                className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {query.isFetching ? "다시 시도하는 중..." : "다시 시도"}
              </button>
            </div>
          ) : query.isPending ? (
            <VehicleListSkeleton />
          ) : (vehicles?.length ?? 0) === 0 ? (
            <p
              role="status"
              className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label"
            >
              {isFiltered
                ? "선택한 조건에 맞는 차량이 없습니다."
                : "등록된 차량이 없습니다."}
            </p>
          ) : (
            <VehicleTable vehicles={vehicles ?? []} />
          )}
        </div>
      </div>
    </section>
  );
}
