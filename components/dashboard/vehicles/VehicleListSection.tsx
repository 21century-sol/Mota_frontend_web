"use client";

import type { VehicleListFilters } from "@/types/dashboard/vehicle";
import { VehicleListFetchError } from "@/lib/dashboard/vehicles/api";
import { useVehicleList } from "@/hooks/dashboard/useVehicleList";
import { VehicleFilterBar } from "@/components/dashboard/vehicles/VehicleFilterBar";
import { VehicleTireStatusFilter } from "@/components/dashboard/vehicles/VehicleTireStatusFilter";
import { VehicleTable } from "@/components/dashboard/vehicles/VehicleTable";
import { VehicleListSkeleton } from "@/components/dashboard/vehicles/VehicleListSkeleton";

/**
 * `/dashboard/vehicles` list section (issue #14, Figma "Vehicle List Section"
 * node 2467:25966 + Filter Tabs 2467:25928 + 타이어 상태 필터 2722:28835).
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
  const isFiltered = filters.status !== undefined || filters.tireStatus !== undefined;

  return (
    <section
      aria-labelledby="vehicle-list-heading"
      className="flex flex-col gap-4 rounded-dashboard-card bg-white p-6 shadow-dashboard-card"
    >
      <h2 id="vehicle-list-heading" className="sr-only">
        차량 목록
      </h2>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <VehicleFilterBar
          currentStatus={filters.status}
          currentTireStatus={filters.tireStatus}
        />
        <VehicleTireStatusFilter
          currentStatus={filters.status}
          currentTireStatus={filters.tireStatus}
        />
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
        ) : query.data.length === 0 ? (
          <p
            role="status"
            className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label"
          >
            {isFiltered
              ? "선택한 조건에 맞는 차량이 없습니다."
              : "등록된 차량이 없습니다."}
          </p>
        ) : (
          <VehicleTable vehicles={query.data} />
        )}
      </div>
    </section>
  );
}
