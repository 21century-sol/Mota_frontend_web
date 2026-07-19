"use client";

import Link from "next/link";

import type { VehicleDetailTab } from "@/lib/dashboard/vehicles/tab-url";
import { VEHICLE_DETAIL_LIST_PATH } from "@/lib/dashboard/vehicles/tab-url";
import { VehicleDetailFetchError } from "@/lib/dashboard/vehicles/detail-api";
import { useVehicleDetail } from "@/hooks/dashboard/useVehicleDetail";
import { VehicleDetailHeader } from "@/components/dashboard/vehicles/VehicleDetailHeader";
import { VehicleDetailSkeleton } from "@/components/dashboard/vehicles/VehicleDetailSkeleton";
import { VehicleInfoPanel } from "@/components/dashboard/vehicles/VehicleInfoPanel";
import { VehicleSidePanel } from "@/components/dashboard/vehicles/VehicleSidePanel";
import { VehicleDetailTabs } from "@/components/dashboard/vehicles/VehicleDetailTabs";

/**
 * `/dashboard/vehicles/[vehicleId]` root section (issue #15). Owns the main
 * `useVehicleDetail` query and its 4 states (PM AC5-AC7):
 * loading → skeleton, `not-found` → AC6's dedicated copy + list link,
 * any other fetch error → AC7's generic error+retry, success → the full
 * header/info-panel/side-panel/tabs layout.
 *
 * `not-found` is checked before the generic error branch so a 404 renders
 * distinct copy instead of the "다시 시도" retry affordance (an idempotent
 * retry cannot resolve a nonexistent vehicleId).
 */
export function VehicleDetailSection({
  vehicleId,
  tab,
  page,
}: {
  vehicleId: string;
  tab: VehicleDetailTab;
  page: number;
}) {
  const query = useVehicleDetail(vehicleId);
  const isNotFound =
    query.error instanceof VehicleDetailFetchError && query.error.kind === "not-found";

  return (
    <div aria-busy={query.isPending}>
      {query.isPending ? (
        <VehicleDetailSkeleton />
      ) : isNotFound ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="m-0 text-base font-medium text-dashboard-vehicles-title">
            차량 정보를 찾을 수 없습니다.
          </p>
          <Link
            href={VEHICLE_DETAIL_LIST_PATH}
            className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2"
          >
            차량 목록으로 돌아가기
          </Link>
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
            {query.error instanceof VehicleDetailFetchError
              ? query.error.userMessage
              : "차량 정보를 불러오지 못했습니다."}
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
      ) : (
        <div className="flex flex-col gap-6">
          <VehicleDetailHeader />

          <VehicleInfoPanel vehicle={query.data} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,802fr)_minmax(0,298fr)] lg:items-start">
            <VehicleDetailTabs
              vehicleId={vehicleId}
              activeTab={tab}
              page={page}
              vehiclePhotoUrl={query.data.imageUrls[0]}
              vehicleModel={query.data.model}
            />
            <VehicleSidePanel vehicleId={vehicleId} />
          </div>
        </div>
      )}
    </div>
  );
}
